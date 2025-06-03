/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Food } from './food.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType() // Thêm ObjectType decorator cho class
@Entity({ name: 'categories' })
export class Category {
    @Field(() => ID) // Thêm Field decorator cho ID
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    name: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    image: string;
    
    @Field(() => [Food], { nullable: true })
    @OneToMany(() => Food, (food) => food.category, {
        onDelete: 'SET NULL'
    })
    foods: Food[];
}
