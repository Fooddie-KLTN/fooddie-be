/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'shipperCertificateInfos' })
export class ShipperCertificateInfo {
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
        comment: 'Car Number used as primary key'
    })
    carNumber: string;

    @Column({ nullable: true })
    cccd: string;

    @Column({ nullable: true })
    driverLicense: string;
    
}
