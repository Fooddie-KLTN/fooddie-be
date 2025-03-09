/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { OneToMany } from 'typeorm';
import { Address } from './address.entity';
import { Message } from './message.entity';
import { Restaurant } from './restaurant.entity';
import { Order } from './order.entity';
import { ShippingDetail } from './shippingDetail.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ nullable: true })
    email: string;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ nullable: false})
    birthday: Date;

    @Column({ nullable: false, default: 0})
    learningtime: number;

    @Column({ nullable: false, default: 0})
    coursenumber: number;

    @OneToMany(() => Address, (address) => address.user)
    addresses: Address[];

    @OneToMany(() => Message, (message) => message.user1)
    messages1: Message[];

    @OneToMany(() => Message, (message) => message.user2)
    messages2: Message[];

    @OneToOne(() => Restaurant, { eager: true })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => ShippingDetail, (shippingDetail) => shippingDetail.shipper)
    shippingDetails: ShippingDetail[];

}
