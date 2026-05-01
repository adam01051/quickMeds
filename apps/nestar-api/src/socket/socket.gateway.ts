import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'ws';
@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketGateway');
	private summaryClients: number = 0;
	public afterInit(server: Server) {
		this.logger.log('WebSocket gateway initialized total: ' + this.summaryClients);
	}

	handleConnection(client: WebSocket, ...args: any[]) {
		this.summaryClients++;
		this.logger.log('Client connected. Total clients: ' + this.summaryClients);
	}
	handleDisconnect(client: WebSocket) {
		this.summaryClients--;
		this.logger.log('Client disconnected. Total clients: ' + this.summaryClients);
	}

	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return 'Hello world!';
	}
}
