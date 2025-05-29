/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

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

    @Field({ nullable: true }) // Add Field decorator for status field if needed
    @Column({ nullable: true, default: 'pending' })
    status: string;

    @Field({ nullable: true }) // Add Field decorator for verification date if needed
    @Column({ nullable: true })
    verifiedAt: Date;
}
