/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, ManyToOne } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { User } from './user.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType() // Thêm ObjectType decorator cho class
@Entity()
export class Address {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  street: string;

  @Field()
  @Column()
  ward: string;

  @Field()
  @Column()
  district: string;

  @Field()
  @Column()
  city: string;

  @Field({ nullable: true })
  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Field({ nullable: true })
  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Field(() => [Restaurant], { nullable: true })
  @OneToMany(() => Restaurant, restaurant => restaurant.address)
  restaurants: Restaurant[];

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.address)
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  isDefault: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  label: string;
}
