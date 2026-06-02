import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Pharmacies, Pharmacy } from '../../libs/dto/pharmacy/pharmacy';
import {
	AgentPharmaciesInquiry,
	AllPharmaciesInquiry,
	OrdinaryInquiry,
	PharmaciesInquiry,
	PharmacyInput,
} from '../../libs/dto/pharmacy/pharmacy.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { PharmacyStatus } from '../../libs/enums/pharmacy.enum';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { StatisticModifier, T } from '../../libs/types/commons';
import { PharmacyUpdate } from '../../libs/dto/pharmacy/pharmacy.update';
import * as moment from 'moment';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { lookUpAuthMemberLiked, lookupMember, shapeIntoMoongoObjectId } from '../../libs/config';

@Injectable()
export class PharmacyService {
	constructor(
		@InjectModel('Pharmacy') private readonly pharmacyModel: Model<Pharmacy>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
	) {}

	public async createPharmacy(input: PharmacyInput): Promise<Pharmacy> {
		try {
			const result = await this.pharmacyModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPharmacies',
				modifier: 1,
			});

			return result;
		} catch (error) {
			console.log('Error, service.model', error);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getPharmacy(memberId: ObjectId, pharmacyId: ObjectId): Promise<Pharmacy> {
		const search: T = {
			_id: pharmacyId,
			pharmacyStatus: PharmacyStatus.ACTIVE,
		};

		const targetPharmacy: Pharmacy = await this.pharmacyModel.findOne(search).lean().exec();
		if (!targetPharmacy) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: pharmacyId, viewGroup: ViewGroup.PHARMACY };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.pharmacyStatsEditor({ _id: pharmacyId, targetKey: 'pharmacyViews', modifier: 1 });
				targetPharmacy.pharmacyViews++;
			}
		}

		const likeInput = {
			memberId: memberId,
			likeRefId: pharmacyId,
			likeGroup: LikeGroup.PHARMACY,
		};
		targetPharmacy.meLiked = await this.likeService.checkLikeExistence(likeInput);
		targetPharmacy.memberData = await this.memberService.getMember(null, targetPharmacy.memberId);

		return targetPharmacy;
	}

	public async pharmacyStatsEditor(input: StatisticModifier): Promise<Pharmacy> {
		const { _id, targetKey, modifier } = input;
		return await this.pharmacyModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}

	public async updatePharmacy(memberId: ObjectId, input: PharmacyUpdate): Promise<Pharmacy> {
		let { deletedAt } = input;
		const { pharmacyStatus } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId,
			pharmacyStatus: PharmacyStatus.ACTIVE,
		};

		if (pharmacyStatus === PharmacyStatus.DELETE) {
			deletedAt = moment().toDate();
			input.deletedAt = deletedAt;
		}

		const result = await this.pharmacyModel.findOneAndUpdate(search, input, { new: true });
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (pharmacyStatus === PharmacyStatus.CLOSED || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberPharmacies',
				modifier: -1,
			});
		}

		return result;
	}

	public async getPharmacies(memberId: ObjectId, input: PharmaciesInquiry): Promise<Pharmacies> {
		const match: T = { pharmacyStatus: PharmacyStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.pharmacyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookUpAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: PharmaciesInquiry): void {
		const { memberId, locationList, typeList, periodsRange, deliveryFeeRange, acceptsInsurance, hasDelivery, text } =
			input.search;

		if (memberId) match.memberId = shapeIntoMoongoObjectId(memberId);
		if (locationList && locationList.length) match.pharmacyLocation = { $in: locationList };
		if (typeList && typeList.length) match.pharmacyType = { $in: typeList };
		if (typeof acceptsInsurance === 'boolean') match.acceptsInsurance = acceptsInsurance;
		if (typeof hasDelivery === 'boolean') match.hasDelivery = hasDelivery;
		if (deliveryFeeRange) {
			match.pharmacyDeliveryFee = { $gte: deliveryFeeRange.start, $lte: deliveryFeeRange.end };
		}
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };

		if (text) {
			const regex = new RegExp(text, 'i');
			match['$or'] = [{ pharmacyName: regex }, { pharmacyDesc: regex }, { pharmacyAddress: regex }];
		}
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Pharmacies> {
		return await this.likeService.getFavoritePharmacies(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Pharmacies> {
		return await this.viewService.getVisitedPharmacies(memberId, input);
	}

	public async getAgentPharmacies(memberId: ObjectId, input: AgentPharmaciesInquiry): Promise<Pharmacies> {
		const { pharmacyStatus } = input.search;

		if (pharmacyStatus === PharmacyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			pharmacyStatus: pharmacyStatus ?? { $ne: PharmacyStatus.DELETE },
		};

		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.pharmacyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }, lookupMember, { $unwind: '$memberData' }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAllPharmaciesByAdmin(input: AllPharmaciesInquiry): Promise<Pharmacies> {
		const { pharmacyStatus, pharmacyLocationList, pharmacyTypeList } = input.search;

		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (pharmacyStatus) match.pharmacyStatus = pharmacyStatus;
		if (pharmacyLocationList) match.pharmacyLocation = { $in: pharmacyLocationList };
		if (pharmacyTypeList) match.pharmacyType = { $in: pharmacyTypeList };

		const result = await this.pharmacyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }, lookupMember, { $unwind: '$memberData' }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updatePharmacyByAdmin(input: PharmacyUpdate): Promise<Pharmacy> {
		let { deletedAt } = input;
		const { pharmacyStatus } = input;
		const search: T = {
			_id: input._id,
			pharmacyStatus: PharmacyStatus.ACTIVE,
		};

		if (pharmacyStatus === PharmacyStatus.DELETE) {
			deletedAt = moment().toDate();
			input.deletedAt = deletedAt;
		}

		const result = await this.pharmacyModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (pharmacyStatus === PharmacyStatus.CLOSED || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPharmacies',
				modifier: -1,
			});
		}

		return result;
	}

	public async removePharmacyByAdmin(pharmacyId: ObjectId): Promise<Pharmacy> {
		const search: T = {
			_id: pharmacyId,
			pharmacyStatus: PharmacyStatus.DELETE,
		};

		const result = await this.pharmacyModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async likeTargetPharmacy(memberId: ObjectId, likeRefId: ObjectId): Promise<Pharmacy> {
		const target: Pharmacy = await this.pharmacyModel
			.findOne({ _id: likeRefId, pharmacyStatus: PharmacyStatus.ACTIVE })
			.exec();

		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.PHARMACY,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.pharmacyStatsEditor({ _id: likeRefId, targetKey: 'pharmacyLikes', modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}
}
