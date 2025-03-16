/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';

@Entity({ name: 'reviews' })
export class Review {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Food, { eager: true })
    @JoinColumn({ name: 'food_id' })
    food: Food;

    @Column({ nullable: true })
    image: string;

    @Column({ nullable: true })
    comment: string;

    @Column({ nullable: true })
    rating: number;

    @Column({ type: 'enum', enum: ['food', 'shipper'] })
    type: 'food' | 'shipper';

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'shipper_id' })
    shipper: User;
}
