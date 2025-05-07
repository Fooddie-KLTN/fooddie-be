/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, OneToMany, CreateDateColumn, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { Address } from './address.entity';
import { ShipperCertificateInfo } from './shipperCertificateInfo.entity';
import { Checkout } from './checkout.entity';
import { Order } from './order.entity';


enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
    FACEBOOK = 'facebook', // Keep if needed, remove otherwise
  }


@Entity({ name: 'users' })
export class User {
    
    @PrimaryColumn({ 
        type: 'varchar', 
        length: 28,
        unique: true, 
        nullable: false,
    })
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string; // Mã hóa bằng bcrypt

    @Column({ nullable: true })
    email: string;

    @ManyToOne(() => Role, role => role.users, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ nullable: true })
    name: string;

    @OneToMany(()=> Address, address=> address.user)
    address: Address;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ nullable: false})
    birthday: Date;

    @CreateDateColumn()
    createdAt: Date;
  
    @Column({ nullable: true })
    lastLoginAt: Date;

    @OneToOne(()=> ShipperCertificateInfo, shipperCertificateInfo=> shipperCertificateInfo.user)
    shipperCertificateInfo: ShipperCertificateInfo;

    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
    authProvider: AuthProvider; // Trường này sẽ lưu thông tin về nhà cung cấp xác thực (email, google, facebook)

    @Column({ nullable: true, name: 'google_id' })
    googleId?: string;
  
    @Column({ nullable: true, name: 'reset_password_token' }) 
    resetPasswordToken?: string;
  
    @Column({ nullable: true, name: 'reset_password_expires' })
    resetPasswordExpires?: Date;  

    @OneToMany(()=> Checkout, checkout=> checkout.user)
    checkouts: Checkout[]; // Danh sách các đơn hàng của người dùng

    @OneToMany(()=> Order, order=> order.user)
    orders: Order[]; // Danh sách các đơn hàng của người dùng
}
