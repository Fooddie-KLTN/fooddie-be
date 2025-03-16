/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Restaurant } from './restaurant.entity';
import { OrderDetail } from './orderDetail.entity';

@Entity({ name: 'foods' })
export class Food {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    image: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    price: string;

    @ManyToOne(() => Category, (category) => category.foods, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ nullable: true })
    discountPercent: string;

    @Column({ nullable: true })
    status: string;
    
    @Column({ nullable: true })
    StarReview: string;

    @Column({ nullable: true })
    purchasedNumber: string;

    @ManyToOne(() => Restaurant, { eager: true })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.food)
    orderDetails: OrderDetail[];
}
