import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'conversations' })
export class Conversation {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => User)
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'participant1_id' })
    participant1: User;

    @Field(() => User)
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'participant2_id' })
    participant2: User;

    @Field({ nullable: true })
    @Column({ nullable: true })
    lastMessage: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    lastMessageAt: Date;

    @Field()
    @Column({ default: false })
    isBlocked: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    blockedBy: string; // User ID who blocked the conversation

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => [Message], { nullable: true })
    @OneToMany(() => Message, message => message.conversation)
    messages: Message[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    conversationType: string; // 'direct', 'support', 'order_related'

    @Field({ nullable: true })
    @Column({ nullable: true })
    orderId: string; // If conversation is related to an order
}