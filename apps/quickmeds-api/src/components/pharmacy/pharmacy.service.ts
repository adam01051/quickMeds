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
import { PharmacyOperatingDayInput } from '../../libs/dto/pharmacy/pharmacy.input';

const DEFAULT_TIMEZONE = 'Asia/Tashkent';
const DEFAULT_DELIVERY_FEE = 3000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeToMinutes = (value: string): number => {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
};

const tashkentNow = (date = new Date()): { dayOfWeek: number; minutes: number } => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: DEFAULT_TIMEZONE,
		weekday: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);
	const weekday = parts.find((part) => part.type === 'weekday')?.value;
	const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
	const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
	const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
	return { dayOfWeek: dayMap[weekday] ?? 1, minutes: hours * 60 + minutes };
};

export const calculateOperatingStatus = (
	pharmacy: Pick<Pharmacy, 'open24Hours' | 'operatingHours'>,
	now = new Date(),
): { hoursConfigured: boolean; isOpenNow: boolean; nextOpeningAt?: Date; nextClosingAt?: Date } => {
	if (pharmacy.open24Hours) return { hoursConfigured: true, isOpenNow: true };
	const hours = pharmacy.operatingHours ?? [];
	if (!hours.length) return { hoursConfigured: false, isOpenNow: false };

	const current = tashkentNow(now);
	const today = hours.find((day) => day.dayOfWeek === current.dayOfWeek);
	const yesterday = hours.find((day) => day.dayOfWeek === (current.dayOfWeek === 1 ? 7 : current.dayOfWeek - 1));
	const isWithin = (day: PharmacyOperatingDayInput | undefined, fromPreviousDay = false): boolean => {
		if (!day || day.isClosed || !day.opensAt || !day.closesAt) return false;
		const opens = timeToMinutes(day.opensAt);
		const closes = timeToMinutes(day.closesAt);
		if (opens < closes) return !fromPreviousDay && current.minutes >= opens && current.minutes < closes;
		return fromPreviousDay ? current.minutes < closes : current.minutes >= opens;
	};

	const isOpenNow = isWithin(today) || isWithin(yesterday, true);
	const tashkentDate = new Date(now.getTime() + 5 * 60 * 60 * 1000);
	const toInstant = (offset: number, value: string): Date => {
		const [hour, minute] = value.split(':').map(Number);
		return new Date(Date.UTC(tashkentDate.getUTCFullYear(), tashkentDate.getUTCMonth(), tashkentDate.getUTCDate() + offset, hour - 5, minute));
	};
	let nextOpeningAt: Date | undefined;
	let nextClosingAt: Date | undefined;
	for (let offset = -1; offset <= 7; offset++) {
		const dayOfWeek = ((current.dayOfWeek - 1 + offset + 7) % 7) + 1;
		const day = hours.find((item) => item.dayOfWeek === dayOfWeek);
		if (!day || day.isClosed || !day.opensAt || !day.closesAt) continue;
		const opening = toInstant(offset, day.opensAt);
		const overnight = timeToMinutes(day.opensAt) > timeToMinutes(day.closesAt);
		const closing = toInstant(offset + (overnight ? 1 : 0), day.closesAt);
		if (!nextOpeningAt && opening > now) nextOpeningAt = opening;
		if (!nextClosingAt && closing > now) nextClosingAt = closing;
	}
	return { hoursConfigured: true, isOpenNow, nextOpeningAt, nextClosingAt };
};

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
			this.normalizePharmacyInput(input);
			const result = await this.pharmacyModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPharmacies',
				modifier: 1,
			});

			return this.withOperatingStatus(result);
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

		return this.withOperatingStatus(targetPharmacy);
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
		this.normalizePharmacyInput(input);
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

		return this.withOperatingStatus(result);
	}

	public async getPharmacies(memberId: ObjectId, input: PharmaciesInquiry): Promise<Pharmacies> {
		const match: T = { pharmacyStatus: PharmacyStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		if (input.sort === 'pharmacyDeliveryFee') match.hasDelivery = true;

		await this.shapeMatchQuery(match, input);

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

		result[0].list = result[0].list.map((pharmacy: Pharmacy) => this.withOperatingStatus(pharmacy));
		return result[0];
	}

	private async shapeMatchQuery(match: T, input: PharmaciesInquiry): Promise<void> {
		const { memberId, locationList, typeList, periodsRange, deliveryFeeRange, acceptsInsurance, hasDelivery, openNow, open24Hours, text } =
			input.search;

		if (memberId) match.memberId = shapeIntoMoongoObjectId(memberId);
		if (locationList && locationList.length) match.pharmacyLocation = { $in: locationList };
		if (typeList && typeList.length) match.pharmacyType = { $in: typeList };
		if (typeof acceptsInsurance === 'boolean') match.acceptsInsurance = acceptsInsurance;
		if (typeof hasDelivery === 'boolean') match.hasDelivery = hasDelivery;
		if (deliveryFeeRange) {
			match.hasDelivery = true;
			match.pharmacyDeliveryFee = { $gte: deliveryFeeRange.start, $lte: deliveryFeeRange.end };
		}
		if (open24Hours === true) match.open24Hours = true;
		if (openNow === true) {
			const candidates = await this.pharmacyModel.find({ ...match }).lean().exec();
			match._id = { $in: candidates.filter((pharmacy: Pharmacy) => this.withOperatingStatus(pharmacy).isOpenNow).map((pharmacy: Pharmacy) => pharmacy._id) };
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
		this.normalizePharmacyInput(input);
		let { deletedAt } = input;
		const { pharmacyStatus } = input;

		const existing = await this.pharmacyModel.findOne({ _id: input._id }).exec();
		if (!existing) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		if (existing.pharmacyStatus === PharmacyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		if (pharmacyStatus === PharmacyStatus.DELETE) {
			deletedAt = moment().toDate();
			input.deletedAt = deletedAt;
		}

		const result = await this.pharmacyModel
			.findOneAndUpdate({ _id: input._id, pharmacyStatus: { $ne: PharmacyStatus.DELETE } }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const wasActive = existing.pharmacyStatus === PharmacyStatus.ACTIVE;
		const isActive = result.pharmacyStatus === PharmacyStatus.ACTIVE;
		if (wasActive !== isActive) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPharmacies',
				modifier: isActive ? 1 : -1,
			});
		}

		return this.withOperatingStatus(result);
	}

	private normalizePharmacyInput(input: PharmacyInput | PharmacyUpdate): void {
		this.validateCoordinates(input);
		if (input.hasDelivery === false) input.pharmacyDeliveryFee = 0;
		if (input.hasDelivery === true && input.pharmacyDeliveryFee === undefined) input.pharmacyDeliveryFee = DEFAULT_DELIVERY_FEE;
		if (input.pharmacyDeliveryFee !== undefined && (!Number.isInteger(input.pharmacyDeliveryFee) || input.pharmacyDeliveryFee < 0)) {
			throw new BadRequestException('Delivery fee must be a non-negative integer UZS amount.');
		}

		input.pharmacyTimezone = DEFAULT_TIMEZONE;
		if (input.open24Hours) input.operatingHours = [];
		if (input.operatingHours) {
			const days = new Set<number>();
			input.operatingHours.forEach((day) => {
				if (days.has(day.dayOfWeek)) throw new BadRequestException('Operating hours may contain each weekday only once.');
				days.add(day.dayOfWeek);
				if (day.isClosed) {
					delete day.opensAt;
					delete day.closesAt;
					return;
				}
				if (!day.opensAt || !day.closesAt || !TIME_PATTERN.test(day.opensAt) || !TIME_PATTERN.test(day.closesAt) || day.opensAt === day.closesAt) {
					throw new BadRequestException('Open days require different valid HH:mm opening and closing times.');
				}
			});
		}
	}

	private validateCoordinates(input: PharmacyInput | PharmacyUpdate): void {
		const hasLatitude = input.pharmacyLatitude !== undefined;
		const hasLongitude = input.pharmacyLongitude !== undefined;
		if (!hasLatitude && !hasLongitude) return;
		if (!hasLatitude || !hasLongitude) {
			throw new BadRequestException('Pharmacy latitude and longitude must be provided together.');
		}

		const { pharmacyLatitude, pharmacyLongitude } = input;
		if (
			typeof pharmacyLatitude !== 'number' ||
			typeof pharmacyLongitude !== 'number' ||
			!Number.isFinite(pharmacyLatitude) ||
			!Number.isFinite(pharmacyLongitude) ||
			pharmacyLatitude < -90 ||
			pharmacyLatitude > 90 ||
			pharmacyLongitude < -180 ||
			pharmacyLongitude > 180 ||
			(pharmacyLatitude === 0 && pharmacyLongitude === 0)
		) {
			throw new BadRequestException('Pharmacy location must use a valid confirmed latitude and longitude.');
		}
	}

	private withOperatingStatus(pharmacy: Pharmacy): Pharmacy {
		const plain = typeof (pharmacy as T)?.toObject === 'function' ? (pharmacy as T).toObject() : pharmacy;
		return Object.assign(plain, calculateOperatingStatus(plain));
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
