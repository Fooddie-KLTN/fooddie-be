/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum ShippingStatus {
    PENDING = 'PENDING',
    SHIPPING = 'SHIPPING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
    COMPLETED = 'COMPLETED',
}

// Register enum for GraphQL
registerEnumType(ShippingStatus, {
  name: 'ShippingStatus',
});

@ObjectType() // Add ObjectType decorator for GraphQL
@Entity({ name: 'shippingDetails' })
export class ShippingDetail {
    @Field(() => ID) // Add Field decorator for GraphQL
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => ShippingStatus, { nullable: true }) // Add Field decorator for GraphQL
    @Column({ nullable: true, type: 'enum', enum: ShippingStatus })
    status: ShippingStatus;

    @Field(() => User, { nullable: true }) // Add Field decorator for GraphQL
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    shipper: User;

    @Field(() => Order, { nullable: true }) // Add Field decorator for GraphQL
    @OneToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Field({ nullable: true }) // Add Field decorator for estimated delivery time
    @Column({ nullable: true })
    estimatedDeliveryTime: Date;

    @Field({ nullable: true }) // Add Field decorator for actual delivery time
    @Column({ nullable: true })
    actualDeliveryTime: Date;

    @Field({ nullable: true }) // Add Field decorator for tracking number
    @Column({ nullable: true })
    trackingNumber: string;
}
