import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { PharmacyLocation, PharmacyStatus, PharmacyType } from '../../enums/pharmacy.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class PharmacyOperatingDay {
	@Field(() => Int)
	dayOfWeek: number;

	@Field(() => Boolean)
	isClosed: boolean;

	@Field(() => String, { nullable: true })
	opensAt?: string;

	@Field(() => String, { nullable: true })
	closesAt?: string;
}

@ObjectType()
export class Pharmacy {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => PharmacyType)
	pharmacyType: PharmacyType;

	@Field(() => PharmacyStatus)
	pharmacyStatus: PharmacyStatus;

	@Field(() => PharmacyLocation)
	pharmacyLocation: PharmacyLocation;

	@Field(() => String)
	pharmacyAddress: string;

	@Field(() => Number)
	pharmacyDeliveryFee: number;

	@Field(() => String)
	pharmacyName: string;

	@Field(() => Number)
	pharmacyLatitude: number;

	@Field(() => Number)
	pharmacyLongitude: number;

	@Field(() => Int)
	pharmacyMedicationCount: number;

	@Field(() => Int)
	pharmacyViews: number;

	@Field(() => Int)
	pharmacyLikes: number;

	@Field(() => Int)
	pharmacyComments: number;

	@Field(() => Int)
	pharmacyRank: number;

	@Field(() => [String])
	pharmacyImages: string[];

	@Field(() => String, { nullable: true })
	pharmacyDesc?: string;

	@Field(() => Boolean)
	acceptsInsurance: boolean;

	@Field(() => Boolean)
	hasDelivery: boolean;

	@Field(() => Boolean)
	open24Hours: boolean;

	@Field(() => String)
	pharmacyTimezone: string;

	@Field(() => [PharmacyOperatingDay])
	operatingHours: PharmacyOperatingDay[];

	@Field(() => Boolean)
	hoursConfigured: boolean;

	@Field(() => Boolean)
	isOpenNow: boolean;

	@Field(() => Date, { nullable: true })
	nextOpeningAt?: Date;

	@Field(() => Date, { nullable: true })
	nextClosingAt?: Date;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	verifiedAt?: Date;

	@Field(() => Member, { nullable: true })
	memberData: Member;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	openedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Pharmacies {
	@Field(() => [Pharmacy])
	list: Pharmacy[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
