import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ChatbotMessageInput, ChatbotResponse } from './chatbot.dto';
import { ChatbotService } from './chatbot.service';

@Controller('api/v1/chatbot')
export class ChatbotController {
	constructor(private readonly chatbotService: ChatbotService) {}

	@Post('message')
	public async message(@Body() input: ChatbotMessageInput, @Req() request: Request): Promise<ChatbotResponse> {
		return this.chatbotService.answer(input, this.getClientKey(request));
	}

	private getClientKey(request: Request): string {
		const forwardedFor = request.headers['x-forwarded-for'];
		if (typeof forwardedFor === 'string' && forwardedFor.trim()) return forwardedFor.split(',')[0].trim();
		if (Array.isArray(forwardedFor) && forwardedFor[0]) return forwardedFor[0];
		return request.ip || request.socket.remoteAddress || 'unknown';
	}
}
