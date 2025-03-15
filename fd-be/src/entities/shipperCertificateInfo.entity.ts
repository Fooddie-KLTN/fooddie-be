/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'shipperCertificateInfos' })
export class ShipperCertificateInfo {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    cccd: string;

    @Column({ nullable: true })
    driverLicense: string;

}
