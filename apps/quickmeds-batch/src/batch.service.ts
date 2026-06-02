import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/quickmeds-api/src/libs/dto/member/member';
import { Pharmacy } from 'apps/quickmeds-api/src/libs/dto/pharmacy/pharmacy';
import { MemberStatus, MemberType } from 'apps/quickmeds-api/src/libs/enums/member.enum';
import { PharmacyStatus } from 'apps/quickmeds-api/src/libs/enums/pharmacy.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Pharmacy') private readonly pharmacyModel: Model<Pharmacy>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.pharmacyModel
			.updateMany(
				{
					pharmacyStatus: PharmacyStatus.ACTIVE,
				},
				{
					pharmacyRank: 0,
				},
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{
					memberRank: 0,
				},
			)
			.exec();
	}

	public async batchTopPharmacies(): Promise<void> {
		const pharmacies: Pharmacy[] = await this.pharmacyModel
			.find({
				pharmacyStatus: PharmacyStatus.ACTIVE,
				pharmacyRank: 0,
			})
			.exec();

		const promisedList = pharmacies.map(async (ele: Pharmacy) => {
			const { _id, pharmacyLikes, pharmacyViews } = ele;
			const rank = pharmacyLikes * 2 + pharmacyViews * 1;
			return await this.pharmacyModel.findByIdAndUpdate(_id, { pharmacyRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberPharmacies, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberPharmacies * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	getHello(): string {
		return 'Welcome to quickMeds batch api server!';
	}
}
