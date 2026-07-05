import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TelegramAuthService } from './telegram-auth.service';

@Controller('auth/telegram')
export class TelegramAuthController {
	constructor(private readonly telegramAuthService: TelegramAuthService) {}

	@Get('start')
	public async start(@Query('returnTo') returnTo: string | undefined, @Res() response: Response): Promise<void> {
		const authorizationUrl = await this.telegramAuthService.createAuthorizationUrl(returnTo);
		response.redirect(authorizationUrl);
	}

	@Get('callback')
	public async callback(
		@Query('code') code: string | undefined,
		@Query('state') state: string | undefined,
		@Query('error') error: string | undefined,
		@Res() response: Response,
	): Promise<void> {
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

		if (error) {
			response.redirect(`${frontendUrl}/account/join?telegram=cancelled`);
			return;
		}

		const result = await this.telegramAuthService.completeLogin(code || '', state || '');
		response.redirect(`${frontendUrl}/auth/telegram/complete?ticket=${encodeURIComponent(result.ticket)}`);
	}

	@Post('exchange')
	public async exchange(@Body('ticket') ticket: string): Promise<{ accessToken: string; returnTo: string }> {
		return await this.telegramAuthService.exchangeTicket(ticket);
	}
}
