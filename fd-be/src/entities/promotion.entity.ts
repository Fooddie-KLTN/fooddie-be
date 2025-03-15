/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'promotions' })
export class Promotion {
        @PrimaryGeneratedColumn("uuid")
        id: string;
    

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    discountPercent: string;

    @Column({ nullable: true })
    code: string;
    
}
