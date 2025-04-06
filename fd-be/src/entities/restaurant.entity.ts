/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';
import { Order } from './order.entity';


export enum RestaurantStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

@Entity({ name: 'restaurants' })
export class Restaurant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    backgroundImage: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    openTime: string;

    @Column({ nullable: true })
    closeTime: string;

    @Column({ nullable: true })
    licenseCode: string;

    @Column({ nullable: true })
    certificateImage: string;

    @Column({
        type: 'enum',
        enum: RestaurantStatus,
        default: RestaurantStatus.PENDING
    })
    status: RestaurantStatus;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @OneToMany(() => Food, (food) => food.restaurant)
    foods: Food[];

    @OneToOne(() => User, { eager: true })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @OneToMany(() => Order, (order) => order.restaurant)
    orders: Order[];

}
