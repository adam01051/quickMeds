jest.mock('../../libs/config', () => ({
	lookUpAuthMemberLiked: jest.fn(),
	lookupMember: {},
	shapeIntoMoongoObjectId: (target: any) => target,
}));

import { PharmacyService } from './pharmacy.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { PharmacyLocation, PharmacyStatus } from '../../libs/enums/pharmacy.enum';

describe('PharmacyService', () => {
	const memberService = {
		memberStatsEditor: jest.fn(),
		getMember: jest.fn(),
	};
	const viewService = {
		recordView: jest.fn(),
	};
	const likeService = {
		checkLikeExistence: jest.fn(),
		toggleLike: jest.fn(),
	};
	const pharmacyModel = {
		create: jest.fn(),
		findOne: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		aggregate: jest.fn(),
	};

	let service: PharmacyService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new PharmacyService(pharmacyModel as any, memberService as any, viewService as any, likeService as any);
	});

	it('increments memberPharmacies when an agent creates a pharmacy', async () => {
		const pharmacy = { _id: 'pharmacy-id', memberId: 'member-id' };
		pharmacyModel.create.mockResolvedValue(pharmacy);

		await expect(service.createPharmacy({ memberId: 'member-id' } as any)).resolves.toEqual(pharmacy);

		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({
			_id: 'member-id',
			targetKey: 'memberPharmacies',
			modifier: 1,
		});
	});

	it('toggles PHARMACY likes and updates pharmacyLikes', async () => {
		const pharmacy = { _id: 'pharmacy-id', pharmacyStatus: PharmacyStatus.ACTIVE };
		pharmacyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(pharmacy) });
		pharmacyModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(pharmacy) });
		likeService.toggleLike.mockResolvedValue(1);

		await expect(service.likeTargetPharmacy('member-id' as any, 'pharmacy-id' as any)).resolves.toEqual(pharmacy);

		expect(likeService.toggleLike).toHaveBeenCalledWith({
			memberId: 'member-id',
			likeRefId: 'pharmacy-id',
			likeGroup: LikeGroup.PHARMACY,
		});
		expect(pharmacyModel.findByIdAndUpdate).toHaveBeenCalledWith(
			'pharmacy-id',
			{ $inc: { pharmacyLikes: 1 } },
			{ new: true },
		);
	});

	it('filters pharmacies by Uzbekistan region without changing the inquiry shape', async () => {
		pharmacyModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]) });

		await service.getPharmacies(null, {
			page: 1,
			limit: 9,
			search: { locationList: [PharmacyLocation.SAMARKAND] },
		} as any);

		expect(pharmacyModel.aggregate).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ $match: { pharmacyStatus: PharmacyStatus.ACTIVE, pharmacyLocation: { $in: [PharmacyLocation.SAMARKAND] } } },
			]),
		);
	});
});
