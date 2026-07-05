import { Schema } from 'mongoose';

const AuthIdentitySchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true,
			index: true,
		},
		provider: {
			type: String,
			required: true,
		},
		providerSubject: {
			type: String,
			required: true,
		},
		telegramId: {
			type: String,
		},
		username: {
			type: String,
		},
		photoUrl: {
			type: String,
		},
	},
	{ timestamps: true, collection: 'auth_identities' },
);

AuthIdentitySchema.index({ provider: 1, providerSubject: 1 }, { unique: true });

export default AuthIdentitySchema;
