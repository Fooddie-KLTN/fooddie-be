/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { SubMessage } from './subMessage.entity';

@Entity({ name: 'messages' })
export class Message {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    status: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user1: User;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user2: User;

    @OneToMany(() => SubMessage, (subMessage) => subMessage.message)
    subMessage: SubMessage[];
    
}
