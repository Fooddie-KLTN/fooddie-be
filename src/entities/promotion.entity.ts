/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType() // Thêm ObjectType decorator cho class
@Entity({ name: 'promotions' })
export class Promotion {
    @Field(() => ID) // Thêm Field decorator cho ID
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    discountPercent: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    code: string;

    @Field(() => [Order], { nullable: true })
    @OneToMany(() => Order, order => order.promotionCode)
    orders: Order[];  
}
