import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import AuthIdentitySchema from '../../schemas/AuthIdentity.model';
import TelegramLoginAttemptSchema from '../../schemas/TelegramLoginAttempt.model';
import TelegramLoginTicketSchema from '../../schemas/TelegramLoginTicket.model';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramAuthService } from './telegram-auth.service';

@Module({
	imports: [
		HttpModule,
		MongooseModule.forFeature([
			{
				name: 'Member',
				schema: MemberSchema,
			},
			{
				name: 'AuthIdentity',
				schema: AuthIdentitySchema,
			},
			{
				name: 'TelegramLoginAttempt',
				schema: TelegramLoginAttemptSchema,
			},
			{
				name: 'TelegramLoginTicket',
				schema: TelegramLoginTicketSchema,
			},
		]),
		JwtModule.register({
			secret: `${process.env.JWT_SECRET}`,
			signOptions: { expiresIn: '30d' },
		}),
	],
	controllers: [TelegramAuthController],
	providers: [AuthService, TelegramAuthService],
	exports: [AuthService],
})
export class AuthModule {}
