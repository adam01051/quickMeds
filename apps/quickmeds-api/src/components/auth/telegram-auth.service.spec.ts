jest.mock('jose', () => ({
	createRemoteJWKSet: jest.fn(() => 'jwks'),
	jwtVerify: jest.fn(),
}));
jest.mock('../../libs/config', () => ({
	shapeIntoMoongoObjectId: (target: any) => target,
}));

import { jwtVerify } from 'jose';
import { TelegramAuthService } from './telegram-auth.service';
import { MemberAuthType, MemberType } from '../../libs/enums/member.enum';

const env = {
	TELEGRAM_OIDC_CLIENT_ID: '123456789',
	TELEGRAM_OIDC_CLIENT_SECRET: 'secret',
	TELEGRAM_OIDC_REDIRECT_URI: 'https://api.quickmeds.uz/auth/telegram/callback',
};

const createQuery = (value: any) => ({
	lean: jest.fn().mockReturnThis(),
	exec: jest.fn().mockResolvedValue(value),
});

describe('TelegramAuthService', () => {
	const memberModel = {
		create: jest.fn(),
		findOne: jest.fn(),
		exists: jest.fn(),
	};
	const authIdentityModel = {
		create: jest.fn(),
		findOne: jest.fn(),
	};
	const loginAttemptModel = {
		create: jest.fn(),
		findOneAndDelete: jest.fn(),
	};
	const loginTicketModel = {
		create: jest.fn(),
		findOneAndDelete: jest.fn(),
	};
	const authService = {
		hashPassword: jest.fn(),
		createToken: jest.fn(),
	};
	let service: TelegramAuthService;

	beforeEach(() => {
		jest.clearAllMocks();
		Object.assign(process.env, env);
		service = new TelegramAuthService(
			memberModel as any,
			authIdentityModel as any,
			loginAttemptModel as any,
			loginTicketModel as any,
			authService as any,
		);
	});

	it('creates an authorization URL with PKCE, state, scope, and redirect URI', async () => {
		await expect(service.createAuthorizationUrl('/mypage?category=messages')).resolves.toContain(
			'https://oauth.telegram.org/auth',
		);

		const url = new URL((await service.createAuthorizationUrl('/mypage?category=messages')) as string);
		expect(url.searchParams.get('client_id')).toBe(env.TELEGRAM_OIDC_CLIENT_ID);
		expect(url.searchParams.get('redirect_uri')).toBe(env.TELEGRAM_OIDC_REDIRECT_URI);
		expect(url.searchParams.get('response_type')).toBe('code');
		expect(url.searchParams.get('scope')).toBe('openid profile');
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
		expect(url.searchParams.get('state')).toBeTruthy();
		expect(url.searchParams.get('code_challenge')).toBeTruthy();
		expect(loginAttemptModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				codeVerifier: expect.any(String),
				returnTo: '/mypage?category=messages',
				expiresAt: expect.any(Date),
			}),
		);
	});

	it('normalizes unsafe return targets to root', () => {
		expect(service.safeReturnTo('https://evil.test')).toBe('/');
		expect(service.safeReturnTo('//evil.test')).toBe('/');
		expect(service.safeReturnTo('javascript:alert(1)')).toBe('/');
		expect(service.safeReturnTo('/pharmacies?input=test')).toBe('/pharmacies?input=test');
	});

	it('rejects expired or reused login tickets', async () => {
		loginTicketModel.findOneAndDelete.mockReturnValue(createQuery(null));
		await expect(service.exchangeTicket('missing')).rejects.toThrow('Telegram login ticket expired.');
	});

	it('exchanges a valid ticket for a normal QuickMeds access token', async () => {
		loginTicketModel.findOneAndDelete.mockReturnValue(createQuery({ memberId: 'member-id', returnTo: '/mypage' }));
		memberModel.findOne.mockReturnValue(createQuery({ _id: 'member-id', memberNick: 'adam' }));
		authService.createToken.mockResolvedValue('quickmeds-jwt');

		await expect(service.exchangeTicket('ticket')).resolves.toEqual({ accessToken: 'quickmeds-jwt', returnTo: '/mypage' });
		expect(authService.createToken).toHaveBeenCalledWith(expect.objectContaining({ _id: 'member-id' }));
	});

	it('uses an existing Telegram identity when completing login', async () => {
		mockTelegramTokenExchange();
		(jwtVerify as jest.Mock).mockResolvedValue({
			payload: { iss: 'https://oauth.telegram.org', aud: '123456789', sub: 'telegram-sub', id: 99 },
		});
		loginAttemptModel.findOneAndDelete.mockReturnValue(
			createQuery({ codeVerifier: 'verifier', returnTo: '/community', expiresAt: new Date() }),
		);
		authIdentityModel.findOne.mockReturnValue(createQuery({ memberId: 'member-id' }));
		memberModel.findOne.mockReturnValue(createQuery({ _id: 'member-id', memberNick: 'existing' }));
		loginTicketModel.create.mockResolvedValue({});

		await expect(service.completeLogin('code', 'state')).resolves.toEqual({
			ticket: expect.any(String),
			returnTo: '/community',
		});
		expect(memberModel.create).not.toHaveBeenCalled();
		expect(loginTicketModel.create).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'member-id' }));
	});

	it('creates a USER with TELEGRAM auth type for a new Telegram identity', async () => {
		mockTelegramTokenExchange();
		(jwtVerify as jest.Mock).mockResolvedValue({
			payload: {
				sub: '123456789012345',
				id: 77,
				name: 'Telegram Person',
				preferred_username: 'telegram_user',
				picture: 'https://cdn.telegram.test/avatar.jpg',
			},
		});
		loginAttemptModel.findOneAndDelete.mockReturnValue(createQuery({ codeVerifier: 'verifier', returnTo: '/' }));
		authIdentityModel.findOne.mockReturnValue(createQuery(null));
		memberModel.exists.mockReturnValue(createQuery(null));
		authService.hashPassword.mockResolvedValue('hashed-random-password');
		memberModel.create.mockResolvedValue({ _id: 'new-member-id', memberNick: 'telegram_user' });
		loginTicketModel.create.mockResolvedValue({});

		await service.completeLogin('code', 'state');

		expect(memberModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				memberType: MemberType.USER,
				memberAuthType: MemberAuthType.TELEGRAM,
				memberPassword: 'hashed-random-password',
				memberFullName: 'Telegram Person',
			}),
		);
		expect(authIdentityModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				memberId: 'new-member-id',
				provider: 'TELEGRAM',
				providerSubject: '123456789012345',
				telegramId: '77',
				username: 'telegram_user',
			}),
		);
	});
});

function mockTelegramTokenExchange() {
	global.fetch = jest.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ id_token: 'telegram-id-token' }),
	}) as any;
}
