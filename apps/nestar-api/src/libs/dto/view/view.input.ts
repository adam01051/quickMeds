import { Field, InputType } from '@nestjs/graphql';

import { ViewGroup } from '../../enums/view.enum';
import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongodb';

@InputType()
export class ViewInput {
	@IsNotEmpty()
	@Field(() => String)
	memberId: ObjectId;

	@IsNotEmpty()
	@Field(() => ViewGroup)
	viewGroup: ViewGroup;

	@IsNotEmpty()
	@Field(() => String)
	viewRefId: ObjectId;
}
