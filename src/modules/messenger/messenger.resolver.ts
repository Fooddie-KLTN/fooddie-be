import { Resolver, Query, Mutation, Args, Context, Int, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessengerService } from './messenger.service';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { pubSub } from 'src/pubsub';

@Resolver()
@UseGuards(AuthGuard)
export class MessengerResolver {
    constructor(private readonly messengerService: MessengerService) {}

    @Mutation(() => Conversation)
    async createConversation(
        @Args('input') createConversationDto: CreateConversationDto,
        @Context() context: any
    ): Promise<Conversation> {
        const userId = context.req.user.uid || context.req.user.id;
        return await this.messengerService.createOrGetConversation(userId, createConversationDto);
    }

    @Query(() => [Conversation])
    async getUserConversations(
        @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
        @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
        @Context() context: any
    ): Promise<Conversation[]> {
        const userId = context.req.user.uid || context.req.user.id;
        const result = await this.messengerService.getUserConversations(userId, page, pageSize);
        return result.items;
    }

    @Mutation(() => Message)
    async sendMessage(
        @Args('input') sendMessageDto: SendMessageDto,
        @Context() context: any
    ): Promise<Message> {
        const userId = context.req.user.uid || context.req.user.id;
        return await this.messengerService.sendMessage(userId, sendMessageDto);
    }

    @Query(() => [Message])
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

    @Mutation(() => Boolean)
    async markMessagesAsRead(
        @Args('conversationId') conversationId: string,
        @Context() context: any
    ): Promise<boolean> {
        const userId = context.req.user.uid || context.req.user.id;
        await this.messengerService.markMessagesAsRead(userId, conversationId);
        return true;
    }

    @Mutation(() => Boolean)
    async deleteMessage(
        @Args('messageId') messageId: string,
        @Context() context: any
    ): Promise<boolean> {
        const userId = context.req.user.uid || context.req.user.id;
        await this.messengerService.deleteMessage(userId, messageId);
        return true;
    }

    @Query(() => Int)
    async getUnreadMessageCount(@Context() context: any): Promise<number> {
        const userId = context.req.user.uid || context.req.user.id;
        return await this.messengerService.getUnreadMessageCount(userId);
    }

    // Real-time message delivery
    @Subscription(() => Message)
    messageSent(@Args('conversationId') conversationId: string) {
        return pubSub.asyncIterableIterator('messageSent');
    }

    // Live read receipts
    @Subscription(() => Boolean)
    messagesRead(@Args('conversationId') conversationId: string) {
        return pubSub.asyncIterableIterator('messagesRead');
    }
}