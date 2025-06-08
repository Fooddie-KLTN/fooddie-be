/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';
import { Order } from './order.entity';
import { Address } from './address.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum RestaurantStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

registerEnumType(RestaurantStatus, {
  name: 'RestaurantStatus',
});

@ObjectType()
@Entity({ name: 'restaurants' })
export class Restaurant {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    name: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    phoneNumber: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    backgroundImage: string;

    @Field(() => Address, { nullable: true })
    @ManyToOne(() => Address, address => address.restaurants, { 
        cascade: true,
        eager: true 
      })
    @JoinColumn()
    address: Address;

    @Field({ nullable: true })
    @Column({ nullable: true })
    avatar: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    openTime: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    closeTime: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    licenseCode: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    certificateImage: string;

    @Field(() => RestaurantStatus, { nullable: true })
    @Column({
        type: 'enum',
        enum: RestaurantStatus,
        default: RestaurantStatus.PENDING
    })
    status: RestaurantStatus;

    @Field({ nullable: true })
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Field({ nullable: true })
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @OneToMany(() => Food, (food) => food.restaurant)
    foods: Food[];

    @OneToOne(() => User, { eager: true })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @OneToMany(() => Order, (order) => order.restaurant)
    orders: Order[];

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

}
