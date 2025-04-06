/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'adresses' })
export class Address {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ nullable: true })
    street: string;

    @Column({ nullable: true })
    city: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    postalCode: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    country: string;
}
