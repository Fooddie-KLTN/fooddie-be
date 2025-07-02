import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { Order } from './order.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'pending_shipper_assignments' })
@Index(['createdAt']) // Index for cleanup queries
@Index(['priority', 'createdAt']) // Index for priority-based retrieval
@Index(['isSentToShipper']) // Index for tracking sent assignments
export class PendingShipperAssignment {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => Order)
    @ManyToOne(() => Order, { eager: true })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Field()
    @Column({ type: 'int', default: 1 })
    priority: number; // Higher number = higher priority

    @Field()
    @Column({ type: 'int', default: 0 })
    attemptCount: number; // Track how many times we've tried to assign this order

    @Field()
    @Column({ type: 'timestamp', nullable: true })
    lastAttemptAt: Date;

    @Field()
    @Column({ type: 'timestamp', nullable: true })
    nextAttemptAt: Date; // When to try again

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    notes: string; // Store any additional info like rejection reasons

    @Field()
    @Column({ type: 'boolean', default: false })
    isSentToShipper: boolean; // Track if order has been sent to a shipper

}