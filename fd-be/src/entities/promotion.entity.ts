/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity({ name: 'promotions' })
export class Promotion {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    discountPercent: number;

    @Column({ nullable: true })
    code: string;

    @OneToMany(() => Order, order => order.promotionCode)
    orders: Order[];  
}
