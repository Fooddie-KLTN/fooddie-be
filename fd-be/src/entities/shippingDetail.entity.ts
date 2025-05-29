/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

export enum ShippingStatus {
    PENDING = 'PENDING',
    SHIPPING = 'SHIPPING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
    COMPLETED = 'COMPLETED',
}

@Entity({ name: 'shippingDetails' })
export class ShippingDetail {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    status: ShippingStatus;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    shipper: User;

    @OneToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    
}
