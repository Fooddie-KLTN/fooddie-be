/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'promotions' })
export class Promotion {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    discountPercent: string;

    @Column({ nullable: true })
    code: string;
    
}
