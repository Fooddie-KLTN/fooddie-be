/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity({ name: 'subMessages' })
export class SubMessage {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @ManyToOne(() => Message, { eager: true })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @Column({ nullable: true })
    content: string;

    @Column({ nullable: true })
    sender: string;
    
}
