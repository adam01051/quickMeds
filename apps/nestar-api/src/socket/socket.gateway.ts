import { Logger } from '@nestjs/common';
import {
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url';
interface MessagePayload {
	event: string;
	text: string;
	memberData: Member;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member;
	action: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClients: number = 0;
	private clientAuthMap = new Map<WebSocket, Member>();
	private messageList: MessagePayload[] = [];

	constructor(private authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit(server: Server) {
		this.logger.log('WebSocket gateway initialized adn total:', this.summaryClients);
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parseUrl = url.parse(req.url, true);
			const {token} = parseUrl.query;

			return await this.authService.verifyToken(token as string);
		} catch (error) {
			this.logger.warn(`Invalid websocket token: ${error}`);
			return null;
		}
	}
	// 1. Added explicit implementation for connection tracking
	public async handleConnection(client: WebSocket, req: any) {
		const authMember = await this.retrieveAuth(req);
		this.summaryClients++;
		this.clientAuthMap.set(client, authMember);
		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClients}]`);
 
		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClients,
			memberData: authMember,
			action: 'joined',
		};
		this.emitMessage(infoMsg);
		client.send(JSON.stringify({ event: 'getMessages', list: this.messageList }));
	}

	// 2. Fixed the logic order here
	public handleDisconnect(client: WebSocket) {
		const authMember = this.clientAuthMap.get(client);

		this.summaryClients--; // Decrement FIRST
		this.clientAuthMap.delete(client);

		const clientNick: string = authMember?.memberNick ?? 'Guest';

		this.logger.verbose(`Disconnection [${clientNick}]  & total [${this.summaryClients}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClients, // Now holds the correct updated count
			memberData: authMember,
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	// 3. Updated based on screenshot
	@SubscribeMessage('message')
	public async handleMessage(client: WebSocket, payload: string): Promise<void> {
		const authMember = this.clientAuthMap.get(client);

		const newMessage: MessagePayload = {
			event: 'message',
			text: payload,
			memberData: authMember,
		};

		const clientNick: string = authMember?.memberNick ?? 'Guest';

		this.logger.verbose(`NEW MESSAGE:[${clientNick}]  ${payload}`);

		this.messageList.push(newMessage);
		if (this.messageList.length > 5) this.messageList.splice(0, this.messageList.length - 5);

		this.emitMessage(newMessage); // Sends to everyone
	}

	// 4. Fixed type definitions to support both payloads
	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}
}
