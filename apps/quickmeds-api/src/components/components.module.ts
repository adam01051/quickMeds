import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { AuthModule } from './auth/auth.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { ViewModule } from './view/view.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		PharmacyModule,
		FollowModule,
		BoardArticleModule,
		CommentModule,
		LikeModule,
		ViewModule,
	],
})
export class ComponentsModule {}
