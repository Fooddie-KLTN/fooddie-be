/* eslint-disable prettier/prettier */
// src/users/entities/user.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

// Define and register enum for review types
enum ReviewType {
  FOOD = 'food',
  SHIPPER = 'shipper'
}

registerEnumType(ReviewType, {
  name: 'ReviewType',
});

@ObjectType() // Add ObjectType decorator for GraphQL
@Entity({ name: 'reviews' })
export class Review {
    @Field(() => ID) // Add Field decorator for GraphQL
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => User)
    @ManyToOne(() => User) // Remove eager: true to avoid circular loading
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field(() => Food, { nullable: true })
    @ManyToOne(() => Food) // Remove eager: true to avoid circular loading
    @JoinColumn({ name: 'food_id' })
    food: Food;

    @Field({ nullable: true })
    @Column({ nullable: true })
    image: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    comment: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    rating: number;

    @Field(() => ReviewType)
    @Column({ type: 'enum', enum: ['food', 'shipper'] })
    type: 'food' | 'shipper';

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User) // Remove eager: true to avoid circular loading
    @JoinColumn({ name: 'shipper_id' })
    shipper: User;
    
    @Field()
    @CreateDateColumn()
    createdAt: Date;
}
