/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
import { Address } from './address.entity';
import { OrderDetail } from './orderDetail.entity';
import { ShippingDetail } from './shippingDetail.entity';
import { Promotion } from './promotion.entity';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Restaurant, { eager: true })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Column({ nullable: true })
    total: string;

    @Column({ nullable: true })
    note: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'confirmed', 'delivering', 'completed', 'canceled'],
        default: 'pending',
    })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Promotion, { eager: true })
    @JoinColumn({ name: 'promotion_id' })
    promotionCode: Promotion;

    @Column({ nullable: true })
    date: string;

    @ManyToOne(() => Address, { eager: true })
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
    orderDetails: OrderDetail[];

    @OneToOne(() => ShippingDetail, { eager: true })
    @JoinColumn({ name: 'shippingDetail_id' })
    shippingDetail: ShippingDetail;


    @Column({ nullable: true })
    paymentMethod: string;

    @Column({ nullable: true })
    paymentDate: string;

    @Column({ default: false })
    isPaid: boolean;
}
