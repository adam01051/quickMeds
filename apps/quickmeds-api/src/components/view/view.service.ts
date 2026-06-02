import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/commons';
import { OrdinaryInquiry } from '../../libs/dto/pharmacy/pharmacy.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Pharmacies } from '../../libs/dto/pharmacy/pharmacy';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExists = await this.checkViewExists(input);
		if (!viewExists) {
			console.log('No existing view found, creating New View.');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExists(input: ViewInput): Promise<View> {
		const { memberId, viewRefId } = input;

		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedPharmacies(memberId: ObjectId, input: OrdinaryInquiry): Promise<Pharmacies> {
		const { page, limit } = input;
		const match: T = {
			viewGroup: ViewGroup.PHARMACY,
			memberId: memberId,
		};
		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'pharmacies',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedPharmacy',
					},
				},
				{ $unwind: '$visitedPharmacy' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupVisit,
							{ $unwind: '$visitedPharmacy.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Pharmacies = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.visitedPharmacy);
		return result;
	}
}
