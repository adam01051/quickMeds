import { Schema } from 'mongoose';

const MessageThreadSchema = new Schema(
	{
		customerId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		pharmacyId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		lastMessageText: {
			type: String,
			default: '',
		},
		lastMessageAt: {
			type: Date,
		},
		customerUnreadCount: {
			type: Number,
			default: 0,
		},
		ownerUnreadCount: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'message_threads' },
);

MessageThreadSchema.index({ customerId: 1, ownerId: 1, pharmacyId: 1 }, { unique: true });
MessageThreadSchema.index({ customerId: 1, lastMessageAt: -1 });
MessageThreadSchema.index({ ownerId: 1, lastMessageAt: -1 });

export default MessageThreadSchema;
