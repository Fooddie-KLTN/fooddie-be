import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './messenger.service';
import { MessengerResolver } from './messenger.resolver';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { User } from 'src/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, User])
    ],
    controllers: [MessengerController],
    providers: [MessengerService, MessengerResolver],
    exports: [MessengerService],
})
export class MessengerModule {}