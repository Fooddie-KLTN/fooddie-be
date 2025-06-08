/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum PromotionType {
    FOOD_DISCOUNT = 'FOOD_DISCOUNT',
    SHIPPING_DISCOUNT = 'SHIPPING_DISCOUNT'
}

// Register enum for GraphQL
registerEnumType(PromotionType, {
    name: 'PromotionType',
});

@ObjectType() // Thêm ObjectType decorator cho class
@Entity({ name: 'promotions' })
export class Promotion {
    @Field(() => ID) // Thêm Field decorator cho ID
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description: string;

    @Field(() => PromotionType)
    @Column({ 
        type: 'enum', 
        enum: PromotionType, 
        default: PromotionType.FOOD_DISCOUNT 
    })
    type: PromotionType;

    @Field({ nullable: true })
    @Column({ name: 'discountPercent', nullable: true })
    discountPercent: number;

    @Field({ nullable: true })
    @Column({ name: 'discountAmount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountAmount: number;

    @Field({ nullable: true })
    @Column({ name: 'minOrderValue', type: 'decimal', precision: 10, scale: 2, nullable: true })
    minOrderValue: number;

    @Field({ nullable: true })
    @Column({ name: 'maxDiscountAmount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxDiscountAmount: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    image: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    code: string;

    @Field({ nullable: true })
    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date;

    @Field({ nullable: true })
    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date;

    @Field({ nullable: true })
    @Column({ name: 'number_of_used', type: 'int', default: 0 })
    numberOfUsed: number;

    @Field({ nullable: true })
    @Column({ name: 'max_usage', type: 'int', nullable: true })
    maxUsage: number;

    @Field(() => [Order], { nullable: true })
    @OneToMany(() => Order, order => order.promotionCode)
    orders: Order[];
}
