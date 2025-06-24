import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { User } from 'src/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessengerService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    /**
     * Create or get existing conversation between two users
     */
    async createOrGetConversation(userId: string, createConversationDto: CreateConversationDto): Promise<Conversation> {
        const { participantId, orderId, conversationType = 'direct' } = createConversationDto;

        // Validate participants exist
        const participant1 = await this.userRepository.findOne({ where: { id: userId } });
        const participant2 = await this.userRepository.findOne({ where: { id: participantId } });

        if (!participant1 || !participant2) {
            throw new NotFoundException('One or both participants not found');
        }

        if (userId === participantId) {
            throw new BadRequestException('Cannot create conversation with yourself');
        }

        // Check if conversation already exists between these participants
        const existingConversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .where(
                '(conversation.participant1_id = :userId AND conversation.participant2_id = :participantId) OR ' +
                '(conversation.participant1_id = :participantId AND conversation.participant2_id = :userId)',
                { userId, participantId }
            )
            .andWhere('conversation.conversationType = :conversationType', { conversationType })
            .getOne();

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        const conversation = this.conversationRepository.create({
            participant1,
            participant2,
            conversationType,
            orderId,
        });

        return await this.conversationRepository.save(conversation);
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<Message> {
        const { conversationId, content, messageType = 'text', attachmentUrl, attachmentType, replyToMessageId, metadata } = sendMessageDto;

        // Find conversation and verify user is a participant
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participant1', 'participant2']
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if user is a participant in this conversation
        if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        // Check if conversation is blocked
        if (conversation.isBlocked) {
            throw new ForbiddenException('This conversation is blocked');
        }

        // Find sender
        const sender = await this.userRepository.findOne({ where: { id: userId } });
        if (!sender) {
            throw new NotFoundException('Sender not found');
        }

        // Validate reply message if provided
        if (replyToMessageId) {
            const replyMessage = await this.messageRepository.findOne({
                where: { id: replyToMessageId, conversation: { id: conversationId } }
            });
            if (!replyMessage) {
                throw new NotFoundException('Reply message not found in this conversation');
            }
        }

        // Create message
        const message = this.messageRepository.create({
            conversation,
            sender,
            content,
            messageType,
            attachmentUrl,
            attachmentType,
            replyToMessageId,
            metadata,
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update conversation's last message info
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        await this.conversationRepository.save(conversation);

        return savedMessage;
    }

    /**
     * Get user's conversations with pagination
     */
    async getUserConversations(userId: string, page = 1, pageSize = 10): Promise<{
        items: Conversation[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const [conversations, totalItems] = await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.participant1', 'participant1')
            .leftJoinAndSelect('conversation.participant2', 'participant2')
            .where(
                'conversation.participant1_id = :userId OR conversation.participant2_id = :userId',
                { userId }
            )
            .orderBy('conversation.lastMessageAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return {
            items: conversations,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Get messages in a conversation with pagination
     */
    async getConversationMessages(userId: string, conversationId: string, page = 1, pageSize = 20): Promise<{
        items: Message[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Verify user is a participant in this conversation
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participant1', 'participant2']
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const [messages, totalItems] = await this.messageRepository.findAndCount({
            where: { 
                conversation: { id: conversationId },
                isDeleted: false 
            },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return {
            items: messages.reverse(), // Reverse to show oldest first
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
        // Verify user is a participant
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participant1', 'participant2']
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        // Mark all unread messages from other participants as read
        await this.messageRepository
            .createQueryBuilder()
            .update(Message)
            .set({ isRead: true, readAt: new Date() })
            .where('conversation_id = :conversationId', { conversationId })
            .andWhere('sender_id != :userId', { userId })
            .andWhere('isRead = false')
            .execute();
    }

    /**
     * Delete a message (soft delete)
     */
    async deleteMessage(userId: string, messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'conversation']
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only allow sender to delete their own messages
        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await this.messageRepository.save(message);
    }

    /**
     * Block/Unblock a conversation
     */
    async toggleBlockConversation(userId: string, conversationId: string): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: ['participant1', 'participant2']
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        if (conversation.isBlocked) {
            // Unblock if currently blocked by this user
            if (conversation.blockedBy === userId) {
                conversation.isBlocked = false;
                conversation.blockedBy = "";
            } else {
                throw new ForbiddenException('Conversation was blocked by another user');
            }
        } else {
            // Block conversation
            conversation.isBlocked = true;
            conversation.blockedBy = userId;
        }

        return await this.conversationRepository.save(conversation);
    }

    /**
     * Get unread message count for user
     */
    async getUnreadMessageCount(userId: string): Promise<number> {
        const count = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoin('message.conversation', 'conversation')
            .where(
                '(conversation.participant1_id = :userId OR conversation.participant2_id = :userId)',
                { userId }
            )
            .andWhere('message.sender_id != :userId', { userId })
            .andWhere('message.isRead = false')
            .andWhere('message.isDeleted = false')
            .getCount();

        return count;
    }
}