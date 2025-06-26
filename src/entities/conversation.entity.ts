import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum ConversationType {
    CUSTOMER_SHOP = 'customer_shop',
    CUSTOMER_SHIPPER = 'customer_shipper',
    SUPPORT = 'support'
}

registerEnumType(ConversationType, {
    name: 'ConversationType',
});

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
    blockedBy: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => [Message], { nullable: true })
    @OneToMany(() => Message, message => message.conversation)
    messages: Message[];

    @Field(() => ConversationType)
    @Column({
        type: 'enum',
        enum: ConversationType,
        default: ConversationType.CUSTOMER_SHOP
    })
    conversationType: ConversationType;

    @Field({ nullable: true })
    @Column({ type: 'uuid', nullable: true })
    orderId?: string; // Required for customer-shipper conversations

    @Field({ nullable: true })
    @Column({ type: 'uuid', nullable: true })
    restaurantId?: string; // Required for customer-shop conversations
}