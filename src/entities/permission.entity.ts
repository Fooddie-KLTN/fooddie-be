import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission as PermissionEnum, PermissionType } from 'src/constants/permission.enum';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

// Register enums for GraphQL if they are used in fields with @Field
// registerEnumType(PermissionEnum, {
//   name: 'PermissionEnum',
// });
// 
// registerEnumType(PermissionType, {
//   name: 'PermissionType',
// });

/**
 * Entity representing a permission in the system
 */
@ObjectType() // Add ObjectType decorator for GraphQL
@Entity('permissions')
export class Permission {
  @Field(() => ID) // Add Field decorator for GraphQL
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true }) // Add Field decorator for GraphQL
  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Field({ nullable: true }) // Add Field decorator for GraphQL
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field() // Add Field decorator for GraphQL
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Field() // Add Field decorator for GraphQL
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field() // Add Field decorator for GraphQL
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [Role], { nullable: true }) // Add Field decorator for GraphQL
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}