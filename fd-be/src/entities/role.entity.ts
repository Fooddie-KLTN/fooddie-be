/* eslint-disable prettier/prettier */
// src/roles/entities/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum DefaultRole {
  SUPER_ADMIN = 'super_admin',
  ADMINISTRATOR = 'administrator',
  USER = 'user',
  SHOP_OWNER = 'shop_owner',
}

// Register the enum for GraphQL
registerEnumType(DefaultRole, {
  name: 'DefaultRole',
});

@ObjectType() // Add ObjectType decorator for GraphQL
@Entity('roles')
export class Role {
  @Field(() => ID) // Add Field decorator for GraphQL
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => DefaultRole) // Add Field decorator for GraphQL
  @Column({
    type: 'varchar',
    length: 50,
    default: DefaultRole.USER,
  })
  name: DefaultRole;

  @Field({ nullable: true }) // Add Field decorator for GraphQL
  @Column({name: 'display_name', type: 'varchar', length: 255, nullable: true })
  displayName: string;

  @Field({ nullable: true }) // Add Field decorator for GraphQL
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field() // Add Field decorator for GraphQL
  @Column({ name: 'is_system' ,type: 'boolean', default: false })
  isSystem: boolean;

  @Field() // Add Field decorator for GraphQL
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field() // Add Field decorator for GraphQL
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [User], { nullable: true }) // Add Field decorator for GraphQL
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @Field(() => [Permission], { nullable: true }) // Add Field decorator for GraphQL
  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
  })
  permissions: Permission[];
}
