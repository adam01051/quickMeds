import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import MessageThreadSchema from '../../schemas/MessageThread.model';
import PharmacySchema from '../../schemas/Pharmacy.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'MessageThread', schema: MessageThreadSchema },
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Pharmacy', schema: PharmacySchema },
		]),
		AuthModule,
		SocketModule,
	],
	providers: [MessageResolver, MessageService],
	exports: [MessageService],
})
export class MessageModule {}
