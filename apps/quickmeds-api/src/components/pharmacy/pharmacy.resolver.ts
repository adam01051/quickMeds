import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PharmacyService } from './pharmacy.service';
import { Pharmacies, Pharmacy, PharmacyOperatingDay } from '../../libs/dto/pharmacy/pharmacy';
import {
	AgentPharmaciesInquiry,
	AllPharmaciesInquiry,
	OrdinaryInquiry,
	PharmaciesInquiry,
	PharmacyInput,
} from '../../libs/dto/pharmacy/pharmacy.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMoongoObjectId } from '../../libs/config';
import { PharmacyUpdate } from '../../libs/dto/pharmacy/pharmacy.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { calculateOperatingStatus } from './pharmacy.service';

@Resolver(() => Pharmacy)
export class PharmacyResolver {
	constructor(private readonly pharmacyService: PharmacyService) {}

	@ResolveField(() => Boolean)
	open24Hours(@Parent() pharmacy: Pharmacy): boolean {
		return pharmacy.open24Hours ?? false;
	}

	@ResolveField(() => String)
	pharmacyTimezone(@Parent() pharmacy: Pharmacy): string {
		return pharmacy.pharmacyTimezone ?? 'Asia/Tashkent';
	}

	@ResolveField(() => [PharmacyOperatingDay])
	operatingHours(@Parent() pharmacy: Pharmacy): PharmacyOperatingDay[] {
		return pharmacy.operatingHours ?? [];
	}

	@ResolveField(() => Boolean)
	hoursConfigured(@Parent() pharmacy: Pharmacy): boolean {
		return calculateOperatingStatus(pharmacy).hoursConfigured;
	}

	@ResolveField(() => Boolean)
	isOpenNow(@Parent() pharmacy: Pharmacy): boolean {
		return calculateOperatingStatus(pharmacy).isOpenNow;
	}

	@ResolveField(() => Date, { nullable: true })
	nextOpeningAt(@Parent() pharmacy: Pharmacy): Date | undefined {
		return calculateOperatingStatus(pharmacy).nextOpeningAt;
	}

	@ResolveField(() => Date, { nullable: true })
	nextClosingAt(@Parent() pharmacy: Pharmacy): Date | undefined {
		return calculateOperatingStatus(pharmacy).nextClosingAt;
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Pharmacy)
	public async createPharmacy(
		@Args('input') input: PharmacyInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacy> {
		console.log('mutation createPharmacy');
		input.memberId = memberId;

		return await this.pharmacyService.createPharmacy(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Pharmacy)
	public async getPharmacy(
		@Args('pharmacyId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacy> {
		console.log('Query: getPharmacy');
		const pharmacyId = shapeIntoMoongoObjectId(input);
		return await this.pharmacyService.getPharmacy(memberId, pharmacyId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Pharmacy)
	public async updatePharmacy(
		@Args('input') input: PharmacyUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacy> {
		console.log('mutation updatePharmacy');
		input._id = shapeIntoMoongoObjectId(input._id);

		return await this.pharmacyService.updatePharmacy(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Pharmacies)
	public async getPharmacies(
		@Args('input') input: PharmaciesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacies> {
		console.log('Query: getPharmacies');

		return await this.pharmacyService.getPharmacies(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Pharmacies)
	public async getAgentPharmacies(
		@Args('input') input: AgentPharmaciesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacies> {
		console.log('Query: getAgentPharmacies');
		return await this.pharmacyService.getAgentPharmacies(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Pharmacy)
	public async likeTargetPharmacy(
		@Args('pharmacyId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacy> {
		console.log('Mutation: likeTargetPharmacy');
		const likeRefId = shapeIntoMoongoObjectId(input);
		return await this.pharmacyService.likeTargetPharmacy(memberId, likeRefId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Pharmacies)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacies> {
		console.log('Query: getFavorites');
		return await this.pharmacyService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Pharmacies)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Pharmacies> {
		console.log('Query: getVisited');
		return await this.pharmacyService.getVisited(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Pharmacies)
	public async getAllPharmaciesByAdmin(@Args('input') input: AllPharmaciesInquiry): Promise<Pharmacies> {
		console.log('Query: getAllPharmaciesByAdmin');
		return await this.pharmacyService.getAllPharmaciesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Pharmacy)
	public async updatePharmacyByAdmin(@Args('input') input: PharmacyUpdate): Promise<Pharmacy> {
		console.log('Mutation: updatePharmacyByAdmin');
		input._id = shapeIntoMoongoObjectId(input._id);
		return await this.pharmacyService.updatePharmacyByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Pharmacy)
	public async removePharmacyByAdmin(@Args('pharmacyId') input: string): Promise<Pharmacy> {
		console.log('Mutation: removePharmacyByAdmin');
		const pharmacyId = shapeIntoMoongoObjectId(input);
		return await this.pharmacyService.removePharmacyByAdmin(pharmacyId);
	}
}
