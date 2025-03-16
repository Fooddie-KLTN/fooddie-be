/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Food } from './food.entity';

@Entity({ name: 'categories' })
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    image: string;
    
    @OneToMany(() => Food, (food) => food.category, {
        onDelete: 'SET NULL'
    })
    foods: Food[];
}
