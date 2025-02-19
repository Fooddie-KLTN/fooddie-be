/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Firebase UID used as primary key'
    })
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string; // Mã hóa bằng bcrypt

    @Column({ nullable: true })
    email: string;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ nullable: false})
    birthday: Date;

    @Column({ nullable: false, default: 0})
    learningtime: number;

    @Column({ nullable: false, default: 0})
    coursenumber: number;
}
