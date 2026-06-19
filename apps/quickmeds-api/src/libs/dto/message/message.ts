import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MessageStatus } from '../../enums/message.enum';
import { Member, TotalCounter } from '../member/member';
import { Pharmacy } from '../pharmacy/pharmacy';

@ObjectType()
export class MessageThread {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	customerId: ObjectId;

	@Field(() => String)
	ownerId: ObjectId;

	@Field(() => String)
	pharmacyId: ObjectId;

	@Field(() => String, { nullable: true })
	lastMessageText?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Int)
	customerUnreadCount: number;

	@Field(() => Int)
	ownerUnreadCount: number;

	@Field(() => Int)
	myUnreadCount: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Member, { nullable: true })
	customerData?: Member;

	@Field(() => Member, { nullable: true })
	ownerData?: Member;

	@Field(() => Pharmacy, { nullable: true })
	pharmacyData?: Pharmacy;
}

@ObjectType()
export class MessageThreads {
	@Field(() => [MessageThread])
	list: MessageThread[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

@ObjectType()
export class Message {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => MessageStatus)
	messageStatus: MessageStatus;

	@Field(() => String)
	threadId: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => String)
	pharmacyId: ObjectId;

	@Field(() => String, { nullable: true })
	messageText?: string;

	@Field(() => [String])
	messageImages: string[];

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Member, { nullable: true })
	senderData?: Member;
}

@ObjectType()
export class Messages {
	@Field(() => [Message])
	list: Message[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
