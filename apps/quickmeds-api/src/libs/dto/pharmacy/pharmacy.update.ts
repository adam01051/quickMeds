import { Field, InputType, Int } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { PharmacyLocation, PharmacyStatus, PharmacyType } from '../../enums/pharmacy.enum';
import { PharmacyOperatingDayInput } from './pharmacy.input';

import { IsInt, IsNotEmpty, IsOptional, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
	@IsOptional()
	@IsInt()
	@Min(0)
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

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	open24Hours?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	pharmacyTimezone?: string;

	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => PharmacyOperatingDayInput)
	@Field(() => [PharmacyOperatingDayInput], { nullable: true })
	operatingHours?: PharmacyOperatingDayInput[];

	verifiedAt?: Date;

	deletedAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	openedAt?: Date;
}
