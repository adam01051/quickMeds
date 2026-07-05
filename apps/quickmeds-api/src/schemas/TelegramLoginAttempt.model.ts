import { Schema } from 'mongoose';

const TelegramLoginAttemptSchema = new Schema(
	{
		stateHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		codeVerifier: {
			type: String,
			required: true,
		},
		nonce: {
			type: String,
		},
		returnTo: {
			type: String,
			default: '/',
		},
		expiresAt: {
			type: Date,
			required: true,
			index: { expires: 0 },
		},
	},
	{ timestamps: true, collection: 'telegram_login_attempts' },
);

export default TelegramLoginAttemptSchema;
