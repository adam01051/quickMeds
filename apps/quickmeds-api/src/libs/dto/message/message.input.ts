import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

@InputType()
export class MessageThreadsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => String)
	threadId: string;
}

@InputType()
export class StartPharmacyConversationInput {
	@IsNotEmpty()
	@Field(() => String)
	pharmacyId: string;

	@IsOptional()
	@IsString()
	@Length(0, 1200)
	@Field(() => String, { nullable: true })
	messageText?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	messageImages?: string[];
}

@InputType()
export class SendMessageInput {
	@IsNotEmpty()
	@Field(() => String)
	threadId: string;

	@IsOptional()
	@IsString()
	@Length(0, 1200)
	@Field(() => String, { nullable: true })
	messageText?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	messageImages?: string[];
}
