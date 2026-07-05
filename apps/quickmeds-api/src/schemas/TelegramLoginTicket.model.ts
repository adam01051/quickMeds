import { Schema } from 'mongoose';

const TelegramLoginTicketSchema = new Schema(
	{
		ticketHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
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
	{ timestamps: true, collection: 'telegram_login_tickets' },
);

export default TelegramLoginTicketSchema;
