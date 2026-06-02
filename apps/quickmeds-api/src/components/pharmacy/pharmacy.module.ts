import { Module } from '@nestjs/common';
import { PharmacyResolver } from './pharmacy.resolver';
import { PharmacyService } from './pharmacy.service';
import { MongooseModule } from '@nestjs/mongoose';
import PharmacySchema from '../../schemas/Pharmacy.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Pharmacy', schema: PharmacySchema }]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
	],
	providers: [PharmacyResolver, PharmacyService],
	exports: [PharmacyService],
})
export class PharmacyModule {}
