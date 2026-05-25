import { Logger } from '@nestjs/common';
import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';

interface MessagePayload {
  event: string;
  text: string;
}

interface InfoPayload {
  event: string;
  totalClients: number;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('SocketEventsGateway');
  private summaryClients: number = 0;

  @WebSocketServer()
  server: Server;

  public afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  // 1. Added explicit implementation for connection tracking
  public handleConnection(client: WebSocket, ...args: any[]) {
    this.summaryClients++;
    this.logger.verbose(`Connection & total [${this.summaryClients}]`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClients,
    };
    this.emitMessage(infoMsg);
  }

  // 2. Fixed the logic order here
  public handleDisconnect(client: WebSocket) {
    this.summaryClients--; // Decrement FIRST
    this.logger.verbose(`Disconnection & total [${this.summaryClients}]`);

    const infoMsg: InfoPayload = {
      event: 'info',
      totalClients: this.summaryClients, // Now holds the correct updated count
    };
    this.broadcastMessage(client, infoMsg);
  }

  // 3. Updated based on screenshot
  @SubscribeMessage('message')
  public async handleMessage(client: WebSocket, payload: string): Promise<void> {
    const newMessage: MessagePayload = { 
      event: 'message', 
      text: payload 
    };

    this.logger.verbose(`NEW MESSAGE: ${payload}`);
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