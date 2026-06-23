import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Direction, Message as ErrorMessage } from '../../libs/enums/common.enum';
import { MessageStatus } from '../../libs/enums/message.enum';
import { PharmacyStatus } from '../../libs/enums/pharmacy.enum';
import { Message, Messages, MessageThread, MessageThreads } from '../../libs/dto/message/message';
import {
	MessageThreadsInquiry,
	MessagesInquiry,
	SendMessageInput,
	StartPharmacyConversationInput,
} from '../../libs/dto/message/message.input';
import { Pharmacy } from '../../libs/dto/pharmacy/pharmacy';
import { T } from '../../libs/types/commons';
import { shapeIntoMoongoObjectId } from '../../libs/config';

const MESSAGE_IMAGE_PREFIX = 'uploads/messages/';
const MESSAGE_IMAGE_PATTERN = /^uploads\/messages\/[A-Za-z0-9_.-]+\.(jpg|jpeg|png)$/i;

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('MessageThread') private readonly messageThreadModel: Model<MessageThread>,
		@InjectModel('Message') private readonly messageModel: Model<Message>,
		@InjectModel('Pharmacy') private readonly pharmacyModel: Model<Pharmacy>,
	) {}

	public async startPharmacyConversation(
		memberId: ObjectId,
		input: StartPharmacyConversationInput,
	): Promise<MessageThread> {
		const pharmacyId = shapeIntoMoongoObjectId(input.pharmacyId);
		const pharmacy = await this.pharmacyModel
			.findOne({ _id: pharmacyId, pharmacyStatus: PharmacyStatus.ACTIVE })
			.lean()
			.exec();
		if (!pharmacy) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		if (String(pharmacy.memberId) === String(memberId)) throw new BadRequestException(ErrorMessage.NOT_ALLOWED_REQUEST);

		const thread = await this.findOrCreateThread(memberId, pharmacy.memberId, pharmacy._id);
		if (this.hasMessageContent(input.messageText, input.messageImages)) {
			await this.createMessage(memberId, thread, {
				messageText: input.messageText,
				messageImages: input.messageImages,
			});
			return await this.getThreadById(memberId, thread._id);
		}

		return await this.getThreadById(memberId, thread._id);
	}

	public async sendMessage(memberId: ObjectId, input: SendMessageInput): Promise<Message> {
		const thread = await this.getRawThreadForParticipant(memberId, shapeIntoMoongoObjectId(input.threadId));
		const message = await this.createMessage(memberId, thread, input);
		return await this.getMessageById(memberId, message._id);
	}

	public async getMyMessageThreads(memberId: ObjectId, input: MessageThreadsInquiry): Promise<MessageThreads> {
		const match: T = { $or: [{ customerId: memberId }, { ownerId: memberId }] };
		const sort: T = { [input.sort ?? 'lastMessageAt']: input.direction ?? Direction.DESC };

		const pipeline: PipelineStage[] = [
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							this.lookupMember('customerId', 'customerData'),
							{ $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
							this.lookupMember('ownerId', 'ownerData'),
							{ $unwind: { path: '$ownerData', preserveNullAndEmptyArrays: true } },
							this.lookupPharmacy(),
							{ $unwind: { path: '$pharmacyData', preserveNullAndEmptyArrays: true } },
							{
								$addFields: {
									myUnreadCount: {
										$cond: [{ $eq: ['$customerId', memberId] }, '$customerUnreadCount', '$ownerUnreadCount'],
									},
								},
							},
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			];
		const result = await this.messageThreadModel
			.aggregate(pipeline)
			.exec();

		return result[0] ?? { list: [], metaCounter: [{ total: 0 }] };
	}

	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<Messages> {
		const thread = await this.getRawThreadForParticipant(memberId, shapeIntoMoongoObjectId(input.threadId));
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.ASC };

		const pipeline: PipelineStage[] = [
				{ $match: { threadId: thread._id, messageStatus: MessageStatus.ACTIVE } },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							this.lookupMember('senderId', 'senderData'),
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			];
		const result = await this.messageModel
			.aggregate(pipeline)
			.exec();

		return result[0] ?? { list: [], metaCounter: [{ total: 0 }] };
	}

	public async markMessageThreadRead(memberId: ObjectId, threadId: ObjectId): Promise<MessageThread> {
		const thread = await this.getRawThreadForParticipant(memberId, threadId);
		const isCustomer = String(thread.customerId) === String(memberId);
		await this.messageModel
			.updateMany(
				{ threadId: thread._id, receiverId: memberId, readAt: { $exists: false }, messageStatus: MessageStatus.ACTIVE },
				{ $set: { readAt: new Date() } },
			)
			.exec();
		const result = await this.messageThreadModel
			.findByIdAndUpdate(
				thread._id,
				{ $set: { [isCustomer ? 'customerUnreadCount' : 'ownerUnreadCount']: 0 } },
				{ new: true },
			)
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.UPDATE_FAILED);
		return { ...result, myUnreadCount: 0 } as MessageThread;
	}

	public async getUnreadMessageCount(memberId: ObjectId): Promise<number> {
		const result = await this.messageThreadModel
			.aggregate([
				{ $match: { $or: [{ customerId: memberId }, { ownerId: memberId }] } },
				{
					$project: {
						unread: {
							$cond: [{ $eq: ['$customerId', memberId] }, '$customerUnreadCount', '$ownerUnreadCount'],
						},
					},
				},
				{ $group: { _id: null, total: { $sum: '$unread' } } },
			])
			.exec();
		return result[0]?.total ?? 0;
	}

	private async findOrCreateThread(customerId: ObjectId, ownerId: ObjectId, pharmacyId: ObjectId): Promise<MessageThread> {
		const result = await this.messageThreadModel
			.findOneAndUpdate(
				{ customerId, ownerId, pharmacyId },
				{ $setOnInsert: { customerId, ownerId, pharmacyId } },
				{ new: true, upsert: true },
			)
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(ErrorMessage.CREATE_FAILED);
		return result;
	}

	private async createMessage(
		memberId: ObjectId,
		thread: MessageThread,
		input: Pick<SendMessageInput, 'messageText' | 'messageImages'>,
	): Promise<Message> {
		const messageText = input.messageText?.trim() ?? '';
		const messageImages = input.messageImages ?? [];
		if (!this.hasMessageContent(messageText, messageImages)) throw new BadRequestException(ErrorMessage.BAD_REQUEST);
		this.validateImages(messageImages);

		const receiverId = String(thread.customerId) === String(memberId) ? thread.ownerId : thread.customerId;
		const result = await this.messageModel.create({
			threadId: thread._id,
			senderId: memberId,
			receiverId,
			pharmacyId: thread.pharmacyId,
			messageText,
			messageImages,
		});

		const preview = messageText || (messageImages.length ? 'Image' : '');
		await this.messageThreadModel
			.findByIdAndUpdate(thread._id, {
				$set: { lastMessageText: preview, lastMessageAt: result.createdAt },
				$inc: {
					[String(thread.customerId) === String(receiverId) ? 'customerUnreadCount' : 'ownerUnreadCount']: 1,
				},
			})
			.exec();

		return result;
	}

	private async getThreadById(memberId: ObjectId, threadId: ObjectId): Promise<MessageThread> {
		const pipeline: PipelineStage[] = [
				{ $match: { _id: threadId, $or: [{ customerId: memberId }, { ownerId: memberId }] } },
				this.lookupMember('customerId', 'customerData'),
				{ $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
				this.lookupMember('ownerId', 'ownerData'),
				{ $unwind: { path: '$ownerData', preserveNullAndEmptyArrays: true } },
				this.lookupPharmacy(),
				{ $unwind: { path: '$pharmacyData', preserveNullAndEmptyArrays: true } },
				{
					$addFields: {
						myUnreadCount: {
							$cond: [{ $eq: ['$customerId', memberId] }, '$customerUnreadCount', '$ownerUnreadCount'],
						},
					},
				},
			];
		const threads = await this.messageThreadModel
			.aggregate(pipeline)
			.exec();
		if (!threads[0]) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return threads[0];
	}

	private async getMessageById(memberId: ObjectId, messageId: ObjectId): Promise<Message> {
		const pipeline: PipelineStage[] = [
				{ $match: { _id: messageId, messageStatus: MessageStatus.ACTIVE } },
				this.lookupMember('senderId', 'senderData'),
				{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'message_threads',
						localField: 'threadId',
						foreignField: '_id',
						as: 'threadData',
					},
				},
				{ $unwind: { path: '$threadData', preserveNullAndEmptyArrays: true } },
				{ $match: { $or: [{ 'threadData.customerId': memberId }, { 'threadData.ownerId': memberId }] } },
				{ $project: { threadData: 0 } },
			];
		const messages = await this.messageModel
			.aggregate(pipeline)
			.exec();
		if (!messages[0]) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return messages[0];
	}

	private async getRawThreadForParticipant(memberId: ObjectId, threadId: ObjectId): Promise<MessageThread> {
		const thread = await this.messageThreadModel
			.findOne({ _id: threadId, $or: [{ customerId: memberId }, { ownerId: memberId }] })
			.lean()
			.exec();
		if (!thread) throw new InternalServerErrorException(ErrorMessage.NO_DATA_FOUND);
		return thread;
	}

	private hasMessageContent(messageText?: string, messageImages?: string[]): boolean {
		return Boolean(messageText?.trim()) || Boolean(messageImages?.length);
	}

	private validateImages(messageImages: string[]): void {
		const invalid = messageImages.some((image) => !image.startsWith(MESSAGE_IMAGE_PREFIX) || !MESSAGE_IMAGE_PATTERN.test(image));
		if (invalid) throw new BadRequestException(ErrorMessage.PROVIDE_ALLOWED_FORMAT);
	}

	private lookupMember(localField: string, as: string): PipelineStage.Lookup {
		return {
			$lookup: {
				from: 'members',
				localField,
				foreignField: '_id',
				as,
			},
		};
	}

	private lookupPharmacy(): PipelineStage.Lookup {
		return {
			$lookup: {
				from: 'pharmacies',
				localField: 'pharmacyId',
				foreignField: '_id',
				as: 'pharmacyData',
			},
		};
	}
}
