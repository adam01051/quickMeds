import { Field, InputType, Int } from '@nestjs/graphql';
import { PharmacyLocation, PharmacyStatus, PharmacyType } from '../../enums/pharmacy.enum';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { availablePharmacySorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PharmacyOperatingDayInput {
	@IsInt()
	@Min(1)
	@Max(7)
	@Field(() => Int)
	dayOfWeek: number;

	@Field(() => Boolean)
	isClosed: boolean;

	@IsOptional()
	@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
	@Field(() => String, { nullable: true })
	opensAt?: string;

	@IsOptional()
	@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
	@Field(() => String, { nullable: true })
	closesAt?: string;
}

@InputType()
export class PharmacyInput {
	@IsNotEmpty()
	@Field(() => PharmacyType)
	pharmacyType: PharmacyType;

	@IsNotEmpty()
	@Field(() => PharmacyLocation)
	pharmacyLocation: PharmacyLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	pharmacyAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	pharmacyName: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Number)
	pharmacyDeliveryFee?: number;

	@IsNotEmpty()
	@Field(() => Number)
	pharmacyLatitude: number;

	@IsNotEmpty()
	@Field(() => Number)
	pharmacyLongitude: number;

	@IsNotEmpty()
	@Field(() => [String])
	pharmacyImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	pharmacyDesc: string;

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

	@IsOptional()
	@Field(() => Date, { nullable: true })
	openedAt?: Date;

	memberId?: ObjectId;
}

@InputType()
export class DeliveryFeeRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class PharmacyInquirySearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [PharmacyLocation], { nullable: true })
	locationList?: PharmacyLocation[];

	@IsOptional()
	@Field(() => [PharmacyType], { nullable: true })
	typeList?: PharmacyType[];

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	acceptsInsurance?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	hasDelivery?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	openNow?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	open24Hours?: boolean;

	@IsOptional()
	@Field(() => DeliveryFeeRange, { nullable: true })
	deliveryFeeRange?: DeliveryFeeRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class PharmaciesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePharmacySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PharmacyInquirySearch)
	search: PharmacyInquirySearch;
}

@InputType()
class AgentPharmacySearch {
	@IsOptional()
	@Field(() => PharmacyStatus, { nullable: true })
	pharmacyStatus?: PharmacyStatus;
}

@InputType()
export class AgentPharmaciesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePharmacySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AgentPharmacySearch)
	search: AgentPharmacySearch;
}

@InputType()
class AllPharmaciesSearch {
	@IsOptional()
	@Field(() => PharmacyStatus, { nullable: true })
	pharmacyStatus?: PharmacyStatus;

	@IsOptional()
	@Field(() => [PharmacyLocation], { nullable: true })
	pharmacyLocationList?: PharmacyLocation[];

	@IsOptional()
	@Field(() => [PharmacyType], { nullable: true })
	pharmacyTypeList?: PharmacyType[];
}

@InputType()
export class AllPharmaciesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePharmacySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllPharmaciesSearch)
	search: AllPharmaciesSearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
