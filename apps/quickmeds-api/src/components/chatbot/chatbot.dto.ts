import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatbotHistoryMessage {
	@IsIn(['user', 'assistant'])
	role: 'user' | 'assistant';

	@IsString()
	@Length(1, 2000)
	content: string;
}

export class ChatbotMessageInput {
	@IsString()
	@IsNotEmpty()
	@Length(1, 1000)
	message: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ChatbotHistoryMessage)
	history?: ChatbotHistoryMessage[];

	@IsOptional()
	@IsIn(['en', 'uz', 'ru', 'ko'])
	locale?: 'en' | 'uz' | 'ru' | 'ko';
}

export interface ChatbotAction {
	label: string;
	href: string;
}

export interface ChatbotLink {
	label: string;
	href: string;
}

export interface ChatbotResponse {
	message: {
		role: 'assistant';
		content: string;
	};
	links?: ChatbotLink[];
	actions?: ChatbotAction[];
	status: 'ok' | 'not_configured' | 'blocked' | 'unavailable' | 'rate_limited';
}
