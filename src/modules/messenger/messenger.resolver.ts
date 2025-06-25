import { Resolver, Query, Mutation, Args, Context, Int, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessengerService } from './messenger.service';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { WebSocketAuthGuard } from 'src/auth/websocket-auth.guard';
import { pubSub } from 'src/pubsub';

@Resolver()
export class MessengerResolver {
    constructor(private readonly messengerService: MessengerService) {}

    @Mutation(() => Conversation)
    @UseGuards(AuthGuard)
    async createConversation(
        @Args('input') createConversationDto: CreateConversationDto,
        @Context() context: any
    ): Promise<Conversation> {
        const userId = context.req.user.uid || context.req.user.id;
        return await this.messengerService.createOrGetConversation(userId, createConversationDto);
    }

    @Query(() => [Conversation])
    @UseGuards(AuthGuard)
    async getUserConversations(
        @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
        @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
        @Context() context: any
    ): Promise<Conversation[]> {
        const userId = context.req.user.uid || context.req.user.id;
        const result = await this.messengerService.getUserConversations(userId, page, pageSize);
        return result.items;
    }


    @Query(() => [Message])
    @UseGuards(AuthGuard)
    async getConversationMessages(
        @Args('conversationId') conversationId: string,
        @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
        @Args('pageSize', { type: () => Int, defaultValue: 20 }) pageSize: number,
        @Context() context: any
    ): Promise<Message[]> {
        const userId = context.req.user.uid || context.req.user.id;
        const result = await this.messengerService.getConversationMessages(userId, conversationId, page, pageSize);
        return result.items;
    }

  @Mutation(() => Message)
    @UseGuards(AuthGuard)
    async sendMessage(
        @Args('input') sendMessageDto: SendMessageDto,
        @Context() context: any
    ): Promise<Message> {
        const userId = context.req.user.uid || context.req.user.id;
        const message = await this.messengerService.sendMessage(userId, sendMessageDto);
        
        // Publish the message to subscribers
        pubSub.publish('messageSent', { 
            messageSent: message,
            conversationId: message.conversation.id 
        });
        
        return message;
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async markMessagesAsRead(
        @Args('conversationId') conversationId: string,
        @Context() context: any
    ): Promise<boolean> {
        const userId = context.req.user.uid || context.req.user.id;
        await this.messengerService.markMessagesAsRead(userId, conversationId);
        
        // Publish read receipt to subscribers
        pubSub.publish('messagesRead', { 
            messagesRead: true,
            conversationId: conversationId 
        });
        
        return true;
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async deleteMessage(
        @Args('messageId') messageId: string,
        @Context() context: any
    ): Promise<boolean> {
        const userId = context.req.user.uid || context.req.user.id;
        await this.messengerService.deleteMessage(userId, messageId);
        return true;
    }

    @Query(() => Int)
    @UseGuards(AuthGuard)
    async getUnreadMessageCount(@Context() context: any): Promise<number> {
        const userId = context.req.user.uid || context.req.user.id;
        return await this.messengerService.getUnreadMessageCount(userId);
    }

  // WebSocket Subscriptions with proper filtering
    @Subscription(() => Message, {
        filter: (payload, variables) => {
            // Only send messages for the specific conversation
            return payload.conversationId === variables.conversationId;
        },
    })
    @UseGuards(WebSocketAuthGuard)
    messageSent(
        @Args('conversationId') conversationId: string,
        @Context() context: any
    ) {
        return pubSub.asyncIterableIterator('messageSent');
    }

    @Subscription(() => Boolean, {
        filter: (payload, variables) => {
            return payload.conversationId === variables.conversationId;
        },
    })
    @UseGuards(WebSocketAuthGuard)
    messagesRead(
        @Args('conversationId') conversationId: string,
        @Context() context: any
    ) {
        return pubSub.asyncIterableIterator('messagesRead');
    }
}