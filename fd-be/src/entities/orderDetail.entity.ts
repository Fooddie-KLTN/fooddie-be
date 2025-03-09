/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { Food } from './food.entity';

@Entity({ name: 'orderDetails' })
export class OrderDetail {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
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
