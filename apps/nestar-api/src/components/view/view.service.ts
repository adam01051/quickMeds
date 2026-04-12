import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/commons';

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
}
