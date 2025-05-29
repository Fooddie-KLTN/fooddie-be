import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export enum CertificateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'shipperCertificateInfos' })
export class ShipperCertificateInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  cccd: string;

  @Column({ nullable: true })
  driverLicense: string;

  @Column({ type: 'enum', enum: CertificateStatus, default: CertificateStatus.PENDING })
  status: CertificateStatus;
}
