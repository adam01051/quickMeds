import { registerEnumType } from '@nestjs/graphql';

export enum MessageStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}

export enum MessageAttachmentType {
	IMAGE = 'IMAGE',
}

registerEnumType(MessageStatus, {
	name: 'MessageStatus',
});

registerEnumType(MessageAttachmentType, {
	name: 'MessageAttachmentType',
});
