/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity({ name: 'shippingDetails' })
export class ShippingDetail {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    shipper: User;

    @OneToOne(() => Order, { eager: true })
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
