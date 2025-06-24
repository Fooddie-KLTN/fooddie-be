import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
@Entity({ name: 'messages' })
@Index(['conversation', 'createdAt']) // Index for efficient message retrieval
@Index(['sender', 'createdAt']) // Index for sender queries
export class Message {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => Conversation)
    @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Field(() => User)
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @Field()
    @Column({ type: 'text' })
    content: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    messageType: string; // 'text', 'image', 'file', 'location', 'order_update'

    @Field({ nullable: true })
    @Column({ nullable: true })
    attachmentUrl: string; // For images, files, etc.

    @Field({ nullable: true })
    @Column({ nullable: true })
    attachmentType: string; // 'image/jpeg', 'application/pdf', etc.

    @Field()
    @Column({ default: false })
    isRead: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    readAt: Date;

    @Field()
    @Column({ default: false })
    isEdited: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    editedAt: Date;

    @Field()
    @Column({ default: false })
    isDeleted: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    deletedAt: Date;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => GraphQLJSON, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // For storing additional data like order info, location coordinates, etc.

    @Field({ nullable: true })
    @Column({ nullable: true })
    replyToMessageId: string; // For reply functionality
}