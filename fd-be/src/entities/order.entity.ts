/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
import { Address } from './address.entity';
import { OrderDetail } from './orderDetail.entity';
import { ShippingDetail } from './shippingDetail.entity';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
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

    @Column({ nullable: true })
    status: string;

    @Column({ nullable: true })
    promotionCode: string;

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
}
