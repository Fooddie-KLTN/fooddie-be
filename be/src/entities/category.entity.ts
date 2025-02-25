/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';

@Entity({ name: 'categories' })
export class Category {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    image: string;
    
    @OneToMany(() => Food, (food) => food.category)
    foods: Food[];
}
