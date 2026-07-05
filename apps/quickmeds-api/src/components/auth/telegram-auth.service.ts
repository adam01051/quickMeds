import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { Model, ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberAuthType, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { AuthService } from './auth.service';

const TELEGRAM_AUTHORIZATION_ENDPOINT = 'https://oauth.telegram.org/auth';
const TELEGRAM_TOKEN_ENDPOINT = 'https://oauth.telegram.org/token';
const TELEGRAM_ISSUER = 'https://oauth.telegram.org';
const TELEGRAM_JWKS = createRemoteJWKSet(new URL('https://oauth.telegram.org/.well-known/jwks.json'));
const TELEGRAM_PROVIDER = 'TELEGRAM';
const ATTEMPT_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL_MS = 2 * 60 * 1000;

interface TelegramLoginAttempt {
	stateHash: string;
	codeVerifier: string;
	nonce?: string;
	returnTo: string;
	expiresAt: Date;
}

interface TelegramLoginTicket {
	ticketHash: string;
	memberId: ObjectId;
	returnTo: string;
	expiresAt: Date;
}

interface AuthIdentity {
	memberId: ObjectId;
	provider: string;
	providerSubject: string;
	telegramId?: string;
	username?: string;
	photoUrl?: string;
}

interface TelegramProfile {
	providerSubject: string;
	telegramId?: string;
	name?: string;
	username?: string;
	photoUrl?: string;
	phoneNumber?: string;
}

@Injectable()
export class TelegramAuthService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('AuthIdentity') private readonly authIdentityModel: Model<AuthIdentity>,
		@InjectModel('TelegramLoginAttempt') private readonly loginAttemptModel: Model<TelegramLoginAttempt>,
		@InjectModel('TelegramLoginTicket') private readonly loginTicketModel: Model<TelegramLoginTicket>,
		private readonly authService: AuthService,
	) {}

	public async createAuthorizationUrl(returnTo?: string): Promise<string> {
		this.assertTelegramConfig();

		const state = this.randomToken(32);
		const codeVerifier = this.randomToken(48);
		const nonce = this.randomToken(24);
		const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

		await this.loginAttemptModel.create({
			stateHash: this.hashOpaqueValue(state),
			codeVerifier,
			nonce,
			returnTo: this.safeReturnTo(returnTo),
			expiresAt: new Date(Date.now() + ATTEMPT_TTL_MS),
		});

		const url = new URL(TELEGRAM_AUTHORIZATION_ENDPOINT);
		url.searchParams.set('client_id', process.env.TELEGRAM_OIDC_CLIENT_ID);
		url.searchParams.set('redirect_uri', process.env.TELEGRAM_OIDC_REDIRECT_URI);
		url.searchParams.set('response_type', 'code');
		url.searchParams.set('scope', 'openid profile');
		url.searchParams.set('state', state);
		url.searchParams.set('nonce', nonce);
		url.searchParams.set('code_challenge', codeChallenge);
		url.searchParams.set('code_challenge_method', 'S256');

		return url.toString();
	}

	public async completeLogin(code: string, state: string): Promise<{ ticket: string; returnTo: string }> {
		if (!code || !state) throw new BadRequestException('Telegram login callback is missing required data.');
		this.assertTelegramConfig();

		const attempt = await this.consumeLoginAttempt(state);
		if (!attempt) throw new UnauthorizedException('Telegram login session expired.');

		const tokens = await this.exchangeCodeForTokens(code, attempt.codeVerifier);
		const payload = await this.verifyIdToken(tokens.id_token, attempt.nonce);
		const member = await this.findOrCreateTelegramMember(this.profileFromClaims(payload));
		const ticket = this.randomToken(32);

		await this.loginTicketModel.create({
			ticketHash: this.hashOpaqueValue(ticket),
			memberId: member._id,
			returnTo: attempt.returnTo,
			expiresAt: new Date(Date.now() + TICKET_TTL_MS),
		});

		return { ticket, returnTo: attempt.returnTo };
	}

	public async exchangeTicket(ticket: string): Promise<{ accessToken: string; returnTo: string }> {
		if (!ticket) throw new BadRequestException('Telegram login ticket is required.');

		const loginTicket = await this.loginTicketModel
			.findOneAndDelete({
				ticketHash: this.hashOpaqueValue(ticket),
				expiresAt: { $gt: new Date() },
			})
			.exec();

		if (!loginTicket) throw new UnauthorizedException('Telegram login ticket expired.');

		const member = await this.memberModel.findOne({ _id: loginTicket.memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!member) throw new UnauthorizedException('Telegram account is not available.');

		return {
			accessToken: await this.authService.createToken(member),
			returnTo: this.safeReturnTo(loginTicket.returnTo),
		};
	}

	public safeReturnTo(returnTo?: string): string {
		if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return '/';
		try {
			const parsed = new URL(returnTo, 'https://quickmeds.local');
			if (parsed.origin !== 'https://quickmeds.local') return '/';
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		} catch (error) {
			return '/';
		}
	}

	private async consumeLoginAttempt(state: string): Promise<TelegramLoginAttempt | null> {
		return await this.loginAttemptModel
			.findOneAndDelete({
				stateHash: this.hashOpaqueValue(state),
				expiresAt: { $gt: new Date() },
			})
			.lean()
			.exec();
	}

	private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{ id_token: string }> {
		const credentials = Buffer.from(
			`${process.env.TELEGRAM_OIDC_CLIENT_ID}:${process.env.TELEGRAM_OIDC_CLIENT_SECRET}`,
		).toString('base64');

		const response = await fetch(TELEGRAM_TOKEN_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`,
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: process.env.TELEGRAM_OIDC_REDIRECT_URI,
				client_id: process.env.TELEGRAM_OIDC_CLIENT_ID,
				code_verifier: codeVerifier,
			}),
		});

		if (!response.ok) throw new UnauthorizedException('Telegram token exchange failed.');

		const tokens = await response.json();
		if (!tokens?.id_token || typeof tokens.id_token !== 'string') {
			throw new UnauthorizedException('Telegram token response did not include an ID token.');
		}

		return { id_token: tokens.id_token };
	}

	private async verifyIdToken(idToken: string, nonce?: string): Promise<JWTPayload> {
		const { payload } = await jwtVerify(idToken, TELEGRAM_JWKS, {
			issuer: TELEGRAM_ISSUER,
			audience: process.env.TELEGRAM_OIDC_CLIENT_ID,
			algorithms: ['RS256'],
		});

		if (nonce && payload.nonce && payload.nonce !== nonce) {
			throw new UnauthorizedException('Telegram login nonce mismatch.');
		}

		return payload;
	}

	private profileFromClaims(payload: JWTPayload): TelegramProfile {
		const providerSubject = payload.sub ? String(payload.sub) : '';
		if (!providerSubject) throw new UnauthorizedException('Telegram identity is missing.');

		return {
			providerSubject,
			telegramId: payload.id ? String(payload.id) : undefined,
			name: payload.name ? String(payload.name) : undefined,
			username: payload.preferred_username ? String(payload.preferred_username) : undefined,
			photoUrl: payload.picture ? String(payload.picture) : undefined,
			phoneNumber:
				payload.phone_number && payload.phone_number_verified === true ? String(payload.phone_number) : undefined,
		};
	}

	private async findOrCreateTelegramMember(profile: TelegramProfile): Promise<Member> {
		const existingIdentity = await this.authIdentityModel
			.findOne({ provider: TELEGRAM_PROVIDER, providerSubject: profile.providerSubject })
			.exec();

		if (existingIdentity) {
			const member = await this.memberModel
				.findOne({ _id: existingIdentity.memberId, memberStatus: { $ne: MemberStatus.DELETE } })
				.exec();
			if (!member || member.memberStatus === MemberStatus.BLOCK) {
				throw new UnauthorizedException('Telegram account is not available.');
			}
			return member;
		}

		const member = await this.memberModel.create({
			memberType: MemberType.USER,
			memberStatus: MemberStatus.ACTIVE,
			memberAuthType: MemberAuthType.TELEGRAM,
			memberNick: await this.createUniqueTelegramNick(profile),
			memberPhone: await this.createUniqueTelegramPhone(profile),
			memberPassword: await this.authService.hashPassword(this.randomToken(48)),
			memberFullName: profile.name,
			memberImage: '',
		});

		await this.authIdentityModel.create({
			memberId: member._id,
			provider: TELEGRAM_PROVIDER,
			providerSubject: profile.providerSubject,
			telegramId: profile.telegramId,
			username: profile.username,
			photoUrl: profile.photoUrl,
		});

		return member;
	}

	private async createUniqueTelegramNick(profile: TelegramProfile): Promise<string> {
		const rawBase = profile.username || profile.name || `tg_${profile.providerSubject.slice(-8)}`;
		const cleaned = rawBase.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 12);
		const base = cleaned.length >= 3 ? cleaned : `tg_${profile.providerSubject.slice(-8)}`;

		for (let index = 0; index < 20; index++) {
			const suffix = index === 0 ? '' : `${index}`;
			const candidate = `${base.slice(0, 12 - suffix.length)}${suffix}`;
			const existing = await this.memberModel.exists({ memberNick: candidate }).exec();
			if (!existing) return candidate;
		}

		return `tg_${this.hashOpaqueValue(profile.providerSubject).slice(0, 9)}`;
	}

	private async createUniqueTelegramPhone(profile: TelegramProfile): Promise<string> {
		const base = profile.phoneNumber || `tg:${profile.providerSubject}`;
		let candidate = base;

		for (let index = 0; index < 20; index++) {
			const existing = await this.memberModel.exists({ memberPhone: candidate }).exec();
			if (!existing) return candidate;
			candidate = `${base}:${index + 1}`;
		}

		return `tg:${this.hashOpaqueValue(profile.providerSubject).slice(0, 16)}`;
	}

	private assertTelegramConfig(): void {
		if (
			!process.env.TELEGRAM_OIDC_CLIENT_ID ||
			!process.env.TELEGRAM_OIDC_CLIENT_SECRET ||
			!process.env.TELEGRAM_OIDC_REDIRECT_URI
		) {
			throw new BadRequestException('Telegram login is not configured.');
		}
	}

	private randomToken(size: number): string {
		return randomBytes(size).toString('base64url');
	}

	private hashOpaqueValue(value: string): string {
		return createHash('sha256').update(value).digest('hex');
	}
}
