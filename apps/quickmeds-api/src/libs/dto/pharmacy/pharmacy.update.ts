import { Field, InputType, Int } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { PharmacyLocation, PharmacyStatus, PharmacyType } from '../../enums/pharmacy.enum';

import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';

@InputType()
export class PharmacyUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => PharmacyType, { nullable: true })
	pharmacyType?: PharmacyType;

	@IsOptional()
	@Field(() => PharmacyStatus, { nullable: true })
	pharmacyStatus?: PharmacyStatus;

	@IsOptional()
	@Field(() => PharmacyLocation, { nullable: true })
	pharmacyLocation?: PharmacyLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	pharmacyAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	pharmacyName?: string;

	@Field(() => Number, { nullable: true })
	pharmacyDeliveryFee?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	pharmacyLatitude?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	pharmacyLongitude?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	pharmacyMedicationCount?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	pharmacyImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	pharmacyDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	acceptsInsurance?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	hasDelivery?: boolean;

	verifiedAt?: Date;

	deletedAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	openedAt?: Date;
}
