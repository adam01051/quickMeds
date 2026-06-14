jest.mock('../../libs/config', () => ({
	lookupMember: { $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'memberData' } },
}));

import { CommentService } from './comment.service';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { Direction } from '../../libs/enums/common.enum';

describe('CommentService', () => {
	const commentModel = {
		create: jest.fn(),
		aggregate: jest.fn(),
	};
	const memberService = {
		memberStatsEditor: jest.fn(),
	};
	const boardArticleService = {
		boardArticleStatsEditor: jest.fn(),
	};
	const pharmacyService = {
		pharmacyStatsEditor: jest.fn(),
	};

	let service: CommentService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new CommentService(
			commentModel as any,
			memberService as any,
			boardArticleService as any,
			pharmacyService as any,
		);
	});

	it('persists a pharmacy comment and increments pharmacy comments', async () => {
		const createdComment = {
			_id: 'comment-id',
			commentStatus: CommentStatus.ACTIVE,
			commentGroup: CommentGroup.PHARMACY,
			commentContent: 'Helpful staff',
			commentRefId: 'pharmacy-id',
			memberId: 'member-id',
			createdAt: new Date(),
		};
		commentModel.create.mockResolvedValue(createdComment);

		await expect(
			service.createComment('member-id' as any, {
				commentGroup: CommentGroup.PHARMACY,
				commentContent: 'Helpful staff',
				commentRefId: 'pharmacy-id' as any,
			}),
		).resolves.toEqual(createdComment);

		expect(commentModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				commentGroup: CommentGroup.PHARMACY,
				commentRefId: 'pharmacy-id',
				memberId: 'member-id',
			}),
		);
		expect(pharmacyService.pharmacyStatsEditor).toHaveBeenCalledWith({
			_id: 'pharmacy-id',
			targetKey: 'pharmacyComments',
			modifier: 1,
		});
	});

	it('filters pharmacy comments, sorts newest first, and preserves missing member data', async () => {
		commentModel.aggregate.mockReturnValue({
			exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]),
		});

		await service.getComments(null, {
			page: 1,
			limit: 5,
			sort: 'createdAt',
			direction: Direction.DESC,
			search: {
				commentRefId: 'pharmacy-id' as any,
				commentGroup: CommentGroup.PHARMACY,
			},
		});

		expect(commentModel.aggregate).toHaveBeenCalledWith([
			{
				$match: {
					commentRefId: 'pharmacy-id',
					commentStatus: CommentStatus.ACTIVE,
					commentGroup: CommentGroup.PHARMACY,
				},
			},
			{ $sort: { createdAt: Direction.DESC } },
			{
				$facet: {
					list: [
						{ $skip: 0 },
						{ $limit: 5 },
						expect.any(Object),
						{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
					],
					metaCounter: [{ $count: 'total' }],
				},
			},
		]);
	});
});
