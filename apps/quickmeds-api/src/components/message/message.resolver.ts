import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMoongoObjectId } from '../../libs/config';
import { Message, Messages, MessageThread, MessageThreads } from '../../libs/dto/message/message';
import {
	MessageThreadsInquiry,
	MessagesInquiry,
	SendMessageInput,
	StartPharmacyConversationInput,
} from '../../libs/dto/message/message.input';
import { MessageService } from './message.service';
import { SocketGateway } from '../../socket/socket.gateway';

@Resolver()
export class MessageResolver {
	constructor(
		private readonly messageService: MessageService,
		private readonly socketGateway: SocketGateway,
	) {}

	@UseGuards(AuthGuard)
	@Query(() => MessageThreads)
	public async getMyMessageThreads(
		@Args('input') input: MessageThreadsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<MessageThreads> {
		console.log('Query: getMyMessageThreads');
		return await this.messageService.getMyMessageThreads(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Messages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Messages> {
		console.log('Query: getMessages');
		input.threadId = shapeIntoMoongoObjectId(input.threadId) as unknown as string;
		return await this.messageService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadMessageCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Query: getUnreadMessageCount');
		return await this.messageService.getUnreadMessageCount(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageThread)
	public async startPharmacyConversation(
		@Args('input') input: StartPharmacyConversationInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<MessageThread> {
		console.log('Mutation: startPharmacyConversation');
		const thread = await this.messageService.startPharmacyConversation(memberId, input);
		this.socketGateway.emitMessageEventToMembers([thread.customerId, thread.ownerId], {
			event: 'message:threadUpdated',
			threadId: String(thread._id),
		});
		await this.emitUnreadCounts(thread.customerId, thread.ownerId);
		return thread;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		console.log('Mutation: sendMessage');
		input.threadId = shapeIntoMoongoObjectId(input.threadId) as unknown as string;
		const message = await this.messageService.sendMessage(memberId, input);
		this.socketGateway.emitMessageEventToMembers([message.senderId, message.receiverId], {
			event: 'message:new',
			threadId: String(message.threadId),
			messageId: String(message._id),
			message: {
				...message,
				_id: String(message._id),
				threadId: String(message.threadId),
				senderId: String(message.senderId),
				receiverId: String(message.receiverId),
				pharmacyId: String(message.pharmacyId),
			},
		});
		await this.emitUnreadCounts(message.senderId, message.receiverId);
		return message;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => MessageThread)
	public async markMessageThreadRead(
		@Args('threadId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<MessageThread> {
		console.log('Mutation: markMessageThreadRead');
		const thread = await this.messageService.markMessageThreadRead(memberId, shapeIntoMoongoObjectId(input));
		this.socketGateway.emitMessageEventToMembers([memberId], {
			event: 'message:read',
			threadId: String(thread._id),
		});
		await this.emitUnreadCounts(memberId);
		return thread;
	}

	private async emitUnreadCounts(...memberIds: ObjectId[]): Promise<void> {
		await Promise.all(
			memberIds.map(async (memberId) => {
				const count = await this.messageService.getUnreadMessageCount(memberId);
				this.socketGateway.emitMessageEventToMembers([memberId], {
					event: 'message:unreadCount',
					count,
				});
			}),
		);
	}
}
