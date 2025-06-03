/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType() // Thêm ObjectType decorator cho class
@Entity({ name: 'notifications' })
export class Notification {
    @Field(() => ID) // Thêm Field decorator cho ID
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    content: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    receiveUser: string;
    
    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field({ nullable: true })
    @Column({ nullable: true, default: false })
    isRead: boolean;
    
    @Field({ nullable: true })
    @Column({ nullable: true })
    type: string;
}
