/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { Food } from './food.entity';

@Entity({ name: 'orderDetails' })
export class OrderDetail {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @ManyToOne(() => Order, { eager: true })
    @JoinColumn({ name: 'order_id' })
    order: Order;
    
    @ManyToOne(() => Food, { eager: true })
    @JoinColumn({ name: 'food_id' })
    food: Food;

    @Column({ nullable: true })
    varity: string;
}
