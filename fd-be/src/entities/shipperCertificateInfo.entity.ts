import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum CertificateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Register enum for GraphQL
registerEnumType(CertificateStatus, {
  name: 'CertificateStatus',
});

@ObjectType() // Add ObjectType decorator for GraphQL
@Entity({ name: 'shipperCertificateInfos' })
export class ShipperCertificateInfo {
    @Field(() => ID) // Add Field decorator for GraphQL
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => User) // Add Field decorator for GraphQL
    @OneToOne(() => User, user => user.shipperCertificateInfo)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field({ nullable: true }) // Add Field decorator for GraphQL
    @Column({ nullable: true })
    cccd: string;

    @Field({ nullable: true }) // Add Field decorator for GraphQL
    @Column({ nullable: true })
    driverLicense: string;

    @Field(() => CertificateStatus) // Add Field decorator for enum status
    @Column({ type: 'enum', enum: CertificateStatus, default: CertificateStatus.PENDING })
    status: CertificateStatus;

    @Field({ nullable: true }) // Add Field decorator for verification date
    @Column({ nullable: true })
    verifiedAt: Date;
}
