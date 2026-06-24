import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
	QUICKMEDS_ASSISTANT_ACTIONS,
	QUICKMEDS_ASSISTANT_KNOWLEDGE,
	QUICKMEDS_ASSISTANT_LINKS,
	QUICKMEDS_ASSISTANT_MEDICAL_REFUSAL,
} from './chatbot.knowledge';
import { ChatbotAction, ChatbotLink, ChatbotMessageInput, ChatbotResponse } from './chatbot.dto';

interface RateLimitBucket {
	count: number;
	resetAt: number;
}

interface AssistantStructuredOutput {
	message?: string;
	links?: ChatbotLink[];
	actions?: ChatbotAction[];
}

@Injectable()
export class ChatbotService {
	private readonly logger = new Logger(ChatbotService.name);
	private readonly defaultModel = 'gemini-3.1-flash-lite';
	private readonly rateLimitWindowMs = 60_000;
	private readonly rateLimitMaxRequests = 10;
	private readonly rateLimitBuckets = new Map<string, RateLimitBucket>();
	private readonly safeFallbackMessage =
		"I'm not fully sure about that. I can help you find pharmacies, contact pharmacies, use Messages, or get support from QuickMeds.";
	private readonly approvedDestinations: ChatbotLink[] = [
		QUICKMEDS_ASSISTANT_LINKS.pharmacy,
		QUICKMEDS_ASSISTANT_LINKS.messages,
		QUICKMEDS_ASSISTANT_LINKS.myPage,
		QUICKMEDS_ASSISTANT_LINKS.becomeOwner,
		QUICKMEDS_ASSISTANT_LINKS.contactSupport,
		QUICKMEDS_ASSISTANT_LINKS.faq,
		QUICKMEDS_ASSISTANT_ACTIONS.startOwnerRegistration,
	];

	public async answer(input: ChatbotMessageInput, clientKey = 'unknown'): Promise<ChatbotResponse> {
		const question = input.message.trim();

		if (!this.consumeRateLimit(clientKey)) {
			return {
				message: {
					role: 'assistant',
					content: 'QuickMeds Assistant is temporarily unavailable. Please try again later or contact QuickMeds support.',
				},
				links: [QUICKMEDS_ASSISTANT_LINKS.faq],
				status: 'rate_limited',
			};
		}

		if (this.isMedicalAdviceRequest(question)) {
			return {
				message: { role: 'assistant', content: QUICKMEDS_ASSISTANT_MEDICAL_REFUSAL },
				status: 'blocked',
			};
		}

		const deterministicResponse = this.answerKnownPlatformQuestion(question);
		if (deterministicResponse) return deterministicResponse;

		if (!process.env.GEMINI_API_KEY) {
			return {
				message: {
					role: 'assistant',
					content: 'QuickMeds Assistant is not configured yet. Please check the FAQ or try again later.',
				},
				links: [QUICKMEDS_ASSISTANT_LINKS.faq],
				status: 'not_configured',
			};
		}

		try {
			return await this.askProvider(input);
		} catch (error) {
			const isRateLimited = this.isProviderRateLimit(error);
			this.logger.warn(`QuickMeds Assistant Gemini request failed: ${this.describeProviderError(error)}`);

			return {
				message: {
					role: 'assistant',
					content: 'QuickMeds Assistant is temporarily unavailable. Please try again later or contact QuickMeds support.',
				},
				links: [QUICKMEDS_ASSISTANT_LINKS.faq],
				status: isRateLimited ? 'rate_limited' : 'unavailable',
			};
		}
	}

	private isMedicalAdviceRequest(question: string): boolean {
		const normalized = question.toLowerCase();
		const medicalAdvicePatterns = [
			/\b(dosage|dose|side effect|side effects|interaction|interactions|contraindication|allergy|allergic)\b/,
			/\b(symptom|symptoms|diagnose|diagnosis|treatment|treat|cure|pain|fever|pregnant|pregnancy)\b/,
			/\b(which|what)\s+(medicine|medication|drug|pill)\b/,
			/\b(can|should)\s+i\s+(take|use|mix|stop)\b/,
			/\b(is|are)\s+.+\s+(safe|dangerous)\b/,
		];

		return medicalAdvicePatterns.some((pattern) => pattern.test(normalized));
	}

	private answerKnownPlatformQuestion(question: string): ChatbotResponse | null {
		const normalized = question.toLowerCase();

		if (/^(hi|hello|hey|salom|assalomu alaykum)\b/.test(normalized)) {
			return this.createResponse(
				'Hello! I can help you find pharmacies, contact a pharmacy, use Messages, or learn about joining QuickMeds as a pharmacy owner. What would you like help with?',
			);
		}

		if (this.matchesAny(normalized, ['find', 'search', 'near me', 'nearby', 'pharmacy near', 'pharmacies near'])) {
			return this.createResponse(
				'Open the Pharmacy page and use the location search or nearby option. You can also use filters such as Open now or Verified pharmacies to narrow the results.',
				[QUICKMEDS_ASSISTANT_LINKS.pharmacy],
			);
		}

		if (this.matchesAny(normalized, ['contact a pharmacy', 'message pharmacy', 'send message', 'call pharmacy'])) {
			return this.createResponse(
				'Open the pharmacy profile you are interested in and choose the contact or message option. Your conversations will appear in Messages.',
				[QUICKMEDS_ASSISTANT_LINKS.messages],
			);
		}

		if (this.matchesAny(normalized, ['add my pharmacy', 'register pharmacy', 'pharmacy owner', 'owner registration', 'become a pharmacy owner'])) {
			return this.createResponse(
				'You can start the registration process from Become a Pharmacy Owner. There you can submit your pharmacy details for review.',
				[QUICKMEDS_ASSISTANT_LINKS.becomeOwner],
				[QUICKMEDS_ASSISTANT_ACTIONS.startOwnerRegistration],
			);
		}

		if (this.matchesAny(normalized, ['contact quickmeds', 'quickmeds support', 'contact support', 'support team'])) {
			return this.createResponse('You can reach the QuickMeds team through Contact Support.', [
				QUICKMEDS_ASSISTANT_LINKS.contactSupport,
			]);
		}

		if (this.matchesAny(normalized, ['where is my page', 'manage my account', 'account page', 'profile page'])) {
			return this.createResponse('Open My Page to manage your account, profile, saved pharmacies, and account tools.', [
				QUICKMEDS_ASSISTANT_LINKS.myPage,
			]);
		}

		if (this.matchesAny(normalized, ['faq', 'common questions', 'help center'])) {
			return this.createResponse('You can find common QuickMeds answers in the FAQ.', [QUICKMEDS_ASSISTANT_LINKS.faq]);
		}

		if (this.matchesAny(normalized, ['unknown route', 'show route', '/mypage', '/pharmacies', '/cs'])) {
			return this.createResponse(this.safeFallbackMessage);
		}

		return null;
	}

	private async askProvider(input: ChatbotMessageInput): Promise<ChatbotResponse> {
		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
		const model = process.env.GEMINI_MODEL || this.defaultModel;
		const response = await ai.models.generateContent({
			model,
			contents: this.buildPrompt(input),
			config: {
				temperature: 0.2,
				maxOutputTokens: 450,
				systemInstruction: this.buildSystemInstruction(),
			},
		});

		const content = response.text?.trim();
		if (!content) {
			throw new Error('Gemini returned an empty assistant response.');
		}

		return this.normalizeStructuredOutput(content);
	}

	private buildSystemInstruction(): string {
		return [
			'You are QuickMeds Assistant, a friendly platform-support guide. Speak naturally, briefly, and clearly.',
			'Answer only QuickMeds platform-support questions.',
			'Use the provided QuickMeds knowledge as the source of truth.',
			`For medical or medicine-related advice, answer exactly: ${QUICKMEDS_ASSISTANT_MEDICAL_REFUSAL}`,
			'Never expose raw URLs, route paths, APIs, code, component names, or implementation details in message text.',
			'When navigation is useful, mention the destination naturally and provide the page name in links.',
			'Only offer links that directly answer the user question. Do not overload replies with unrelated links or actions.',
			'Do not invent unsupported features, contact details, policies, stock, prices, prescription workflows, medicine inventory, pharmacy-owner requirements, or medical facts.',
			'If the answer is not covered by the verified knowledge, say you cannot confirm it and suggest checking QuickMeds support or FAQ.',
			'Return only valid JSON with this shape: {"message":"natural user-facing text without raw routes","links":[{"label":"Pharmacy","href":"/pharmacies"}],"actions":[]}.',
			'Allowed link labels and hrefs only: Pharmacy=/pharmacies, Messages=/mypage?category=messages, My Page=/mypage, Become a Pharmacy Owner=/mypage?category=addPharmacy, Contact Support=/cs, FAQ=/cs?tab=faq.',
			'Use actions only for direct user actions. The only approved action is Start pharmacy registration=/mypage?category=addPharmacy.',
			QUICKMEDS_ASSISTANT_KNOWLEDGE,
		].join('\n\n');
	}

	private buildPrompt(input: ChatbotMessageInput): string {
		const history = (input.history || [])
			.slice(-8)
			.map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
			.join('\n');

		return [
			history ? `Recent conversation:\n${history}` : '',
			`User question:\n${input.message}`,
			'Answer as QuickMeds Assistant using only verified QuickMeds platform knowledge.',
		]
			.filter(Boolean)
			.join('\n\n');
	}

	private normalizeStructuredOutput(raw: string): ChatbotResponse {
		const parsed = this.parseStructuredOutput(raw);
		if (!parsed?.message) return this.createResponse(this.safeFallbackMessage);

		const message = this.sanitizeMessage(parsed.message);
		if (!message) return this.createResponse(this.safeFallbackMessage);

		return this.createResponse(message, parsed.links, parsed.actions);
	}

	private parseStructuredOutput(raw: string): AssistantStructuredOutput | null {
		const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
		const jsonStart = cleaned.indexOf('{');
		const jsonEnd = cleaned.lastIndexOf('}');
		if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

		try {
			return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as AssistantStructuredOutput;
		} catch {
			return null;
		}
	}

	private createResponse(message: string, links: ChatbotLink[] = [], actions: ChatbotAction[] = []): ChatbotResponse {
		const sanitizedMessage = this.sanitizeMessage(message) || this.safeFallbackMessage;
		const safeLinks = this.filterApprovedDestinations(links);
		const safeActions = this.filterApprovedDestinations(actions);

		return {
			message: { role: 'assistant', content: sanitizedMessage },
			...(safeLinks.length ? { links: safeLinks } : {}),
			...(safeActions.length ? { actions: safeActions } : {}),
			status: 'ok',
		};
	}

	private sanitizeMessage(message: string): string {
		return message
			.replace(/https?:\/\/\S+/gi, '')
			.replace(/\/[a-z][\w/-]*(?:\?[\w=&-]+)?/gi, '')
			.replace(/\b(api|endpoint|component|route|href)\b:?/gi, '')
			.replace(/\s{2,}/g, ' ')
			.trim();
	}

	private filterApprovedDestinations<T extends ChatbotLink>(destinations: T[] = []): T[] {
		const approved = destinations.filter((destination) =>
			this.approvedDestinations.some(
				(approvedDestination) =>
					approvedDestination.label === destination.label && approvedDestination.href === destination.href,
			),
		);

		return approved.filter(
			(destination, index, list) =>
				list.findIndex((candidate) => candidate.label === destination.label && candidate.href === destination.href) === index,
		);
	}

	private matchesAny(value: string, needles: string[]): boolean {
		return needles.some((needle) => value.includes(needle));
	}

	private consumeRateLimit(clientKey: string): boolean {
		const now = Date.now();
		const bucket = this.rateLimitBuckets.get(clientKey);

		if (!bucket || bucket.resetAt <= now) {
			this.rateLimitBuckets.set(clientKey, { count: 1, resetAt: now + this.rateLimitWindowMs });
			return true;
		}

		if (bucket.count >= this.rateLimitMaxRequests) return false;
		bucket.count += 1;
		return true;
	}

	private isProviderRateLimit(error: unknown): boolean {
		const description = this.describeProviderError(error).toLowerCase();
		return (
			description.includes('429') ||
			description.includes('resource_exhausted') ||
			description.includes('rate limit') ||
			description.includes('quota')
		);
	}

	private describeProviderError(error: unknown): string {
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		try {
			return JSON.stringify(error);
		} catch {
			return 'Unknown provider error';
		}
	}

}
