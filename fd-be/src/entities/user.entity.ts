/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, CreateDateColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { Address } from './address.entity';
import { ShipperCertificateInfo } from './shipperCertificateInfo.entity';
import { Checkout } from './checkout.entity';
import { Order } from './order.entity';
import { Restaurant } from './restaurant.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
}

// Đăng ký enum cho GraphQL
registerEnumType(AuthProvider, {
    name: 'AuthProvider',
});

@ObjectType() // Thêm ObjectType decorator cho class
@Entity({ name: 'users' })
export class User {
    @Field(() => ID) // ID GraphQL type
    @PrimaryColumn({
        type: 'varchar',
        length: 28,
        unique: true,
        nullable: false,
    })
    id: string;

    @Field()
    @Column({ unique: true })
    username: string;

    // Không thêm @Field cho password vì lý do bảo mật
    @Column()
    password: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    email: string;

    @Field(() => Role, { nullable: true })
    @ManyToOne(() => Role, role => role.users, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Field({ nullable: true })
    @Column({ nullable: true })
    name: string;

    @Field(() => [Address], { nullable: true })
    @OneToMany(() => Address, address => address.user, { eager: true, cascade: true })
    @JoinColumn({ name: 'address_id' })
    address: Address[];

    @Field({ nullable: true })
    @Column({ nullable: true, unique: true })
    phone: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    avatar: string;

    @Field()
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Field()
    @Column({ nullable: false })
    birthday: Date;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field({ nullable: true })
    @Column({ nullable: true })
    lastLoginAt: Date;

    @Field(() => ShipperCertificateInfo, { nullable: true })
    @OneToOne(() => ShipperCertificateInfo, shipperCertificateInfo => shipperCertificateInfo.user)
    shipperCertificateInfo: ShipperCertificateInfo;

    @Field(() => AuthProvider)
    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
    authProvider: AuthProvider;

    @Field({ nullable: true })
    @Column({ nullable: true, name: 'google_id' })
    googleId?: string;

    // Không thêm @Field cho các thông tin nhạy cảm liên quan đến reset password
    @Column({ nullable: true, name: 'reset_password_token' })
    resetPasswordToken?: string;

    @Column({ nullable: true, name: 'reset_password_expires' })
    resetPasswordExpires?: Date;

    @Field(() => [Checkout], { nullable: true })
    @OneToMany(() => Checkout, checkout => checkout.user)
    checkouts: Checkout[];

    @Field(() => [Order], { nullable: true })
    @OneToMany(() => Order, order => order.user)
    orders: Order[];

    @Field(() => [Restaurant], { nullable: true })
    @OneToMany(() => Restaurant, restaurant => restaurant.owner)
    restaurants: Restaurant[];
}
