/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
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
    content: string;

    @Column({ nullable: true })
    receiveUser: string;
    
}
