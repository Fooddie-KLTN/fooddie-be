/* eslint-disable prettier/prettier */
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
import { Address } from './address.entity';
import { OrderDetail } from './orderDetail.entity';
import { ShippingDetail } from './shippingDetail.entity';
import { Promotion } from './promotion.entity';
import { Checkout } from './checkout.entity';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'orders' })
export class Order {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field(() => Restaurant, { nullable: true })
    @ManyToOne(() => Restaurant, { eager: true })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Field({ nullable: true })
    @Column({ nullable: true })
    total: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    note: string;

    @Field({ nullable: true })
    @Column({
        type: 'enum',
        enum: ['pending', 'confirmed', 'delivering', 'completed', 'canceled', 'processing_payment'],
        default: 'pending',
        nullable: true,
    })
    status: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => Promotion, { nullable: true })
    @ManyToOne(() => Promotion)
    @JoinColumn({ name: 'promotion_id' })
    promotionCode: Promotion;

    @Field({ nullable: true })
    @Column({ nullable: true })
    date: string;

    @Field(() => Address, { nullable: true })
    @ManyToOne(() => Address, { eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @Field(() => [OrderDetail], { nullable: true })
    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, { cascade: true })
    orderDetails: OrderDetail[];

    @Field(() => ShippingDetail, { nullable: true })
    @OneToOne(() => ShippingDetail, shippingDetail => shippingDetail.order, { cascade: true }) // Corrected inverse side
    @JoinColumn({ name: 'shippingDetail_id' })
    shippingDetail: ShippingDetail;

    @Field({ nullable: true })
    @Column({ nullable: true })
    paymentMethod: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    paymentDate: string;

    @Field()
    @Column({ default: false })
    isPaid: boolean;

    @Field(() => [Checkout], { nullable: true })
    @OneToMany(() => Checkout, checkout => checkout.order)
    checkout: Checkout[];

    // Add these new fields
    @Field(() => Float, { nullable: true })
    @Column({ type: 'float', nullable: true })
    deliveryDistance?: number;

    @Field({ nullable: true })
    @Column({ type: 'int', nullable: true })
    estimatedDeliveryTime?: number; // in minutes

    @Field({ nullable: true })
    @Column({ default: 'asap' })
    deliveryType?: 'asap' | 'scheduled';

    @Field({ nullable: true })
    @Column({ nullable: true })
    requestedDeliveryTime?: string; // Stores the ISO string of the requested time

    @Field({ nullable: true })
    @Column({ type: 'int', nullable: true })
    shippingFee?: number;

    // Add new fields for shipper earnings
    @Field({ nullable: true })
    @Column({ type: 'int', nullable: true })
    shipperEarnings?: number; // How much shipper gets from this order

    @Field({ nullable: true })
    @Column({ type: 'float', default: 0.8, nullable: true })
    shipperCommissionRate?: number; // Default 80% of shipping fee goes to shipper
}
