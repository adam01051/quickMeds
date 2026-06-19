import { Schema } from 'mongoose';
import { MessageStatus } from '../libs/enums/message.enum';

const MessageSchema = new Schema(
	{
		messageStatus: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.ACTIVE,
		},
		threadId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		pharmacyId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		messageText: {
			type: String,
			default: '',
		},
		messageImages: {
			type: [String],
			default: [],
		},
		readAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ threadId: 1, createdAt: -1 });

export default MessageSchema;
