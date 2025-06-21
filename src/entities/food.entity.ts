/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { Restaurant } from './restaurant.entity';
import { OrderDetail } from './orderDetail.entity';
import { Checkout } from './checkout.entity';
import { Review } from './review.entity'; // Add this import
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'foods' })
export class Food {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    image: string;

    @Field(() => [String], { nullable: true })
    @Column("simple-array", { nullable: true, name: 'image_urls' })
    imageUrls: string[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    name: string;

    @Field({ nullable: true })
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Field({ nullable: true })
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'discount_percent' })
    discountPercent: number;

    @Field({ nullable: true })
    @Column({ type: 'int', default: 0, nullable: true, name: 'sold_count' })
    soldCount: number;

    @Field({ nullable: true })
    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    rating: number;

    @Field({ nullable: true })
    @Column({ type: 'int', default: 0, nullable: true, name: 'purchased_number' })
    purchasedNumber: number;

    @Field(() => Category, { nullable: true })
    @ManyToOne(() => Category, (category) => category.foods, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'category_id' })
    category?: Category;

    @Field({ nullable: true })
    @Column({ nullable: true })
    status: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    tag: string;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Field({ nullable: true })
    @Column({ nullable: true, name: 'preparation_time' })
    preparationTime: number;

    @Field(() => Restaurant)
    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @Field(() => [OrderDetail], { nullable: true })
    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.food)
    orderDetails: OrderDetail[];

    // Add the reviews relationship
    @Field(() => [Review], { nullable: true })
    @OneToMany(() => Review, (review) => review.food)
    reviews?: Review[];
}
