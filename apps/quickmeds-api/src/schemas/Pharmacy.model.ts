import { Schema } from 'mongoose';
import { PharmacyLocation, PharmacyStatus, PharmacyType } from '../libs/enums/pharmacy.enum';

const PharmacySchema = new Schema(
	{
		pharmacyType: {
			type: String,
			enum: PharmacyType,
			required: true,
		},

		pharmacyStatus: {
			type: String,
			enum: PharmacyStatus,
			default: PharmacyStatus.ACTIVE,
		},

		pharmacyLocation: {
			type: String,
			enum: PharmacyLocation,
			required: true,
		},

		pharmacyAddress: {
			type: String,
			required: true,
		},

		pharmacyName: {
			type: String,
			required: true,
		},

		pharmacyDeliveryFee: {
			type: Number,
			required: true,
		},

		pharmacyLatitude: {
			type: Number,
			required: true,
		},

		pharmacyLongitude: {
			type: Number,
			required: true,
		},

		pharmacyMedicationCount: {
			type: Number,
			default: 0,
		},

		pharmacyViews: {
			type: Number,
			default: 0,
		},

		pharmacyLikes: {
			type: Number,
			default: 0,
		},

		pharmacyComments: {
			type: Number,
			default: 0,
		},

		pharmacyRank: {
			type: Number,
			default: 0,
		},

		pharmacyImages: {
			type: [String],
			required: true,
		},

		pharmacyDesc: {
			type: String,
		},

		acceptsInsurance: {
			type: Boolean,
			default: false,
		},

		hasDelivery: {
			type: Boolean,
			default: false,
		},

		open24Hours: {
			type: Boolean,
			default: false,
		},

		pharmacyTimezone: {
			type: String,
			default: 'Asia/Tashkent',
		},

		operatingHours: {
			type: [
				{
					_id: false,
					dayOfWeek: { type: Number, min: 1, max: 7, required: true },
					isClosed: { type: Boolean, required: true },
					opensAt: String,
					closesAt: String,
				},
			],
			default: [],
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		verifiedAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},

		openedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'pharmacies' },
);

PharmacySchema.index({ pharmacyType: 1, pharmacyLocation: 1, pharmacyName: 1, pharmacyAddress: 1 }, { unique: true });
PharmacySchema.index({
	pharmacyName: 'text',
	pharmacyDesc: 'text',
	pharmacyAddress: 'text',
	pharmacyLocation: 'text',
});

export default PharmacySchema;
