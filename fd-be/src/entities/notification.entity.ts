/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    content: string;

    @Column({ nullable: true })
    receiveUser: string;
    
}
