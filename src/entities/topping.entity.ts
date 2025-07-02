import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Food } from './food.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'toppings' })
export class Topping {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number; // 0 means free topping

    @Field()
    @Column({ default: true })
    isAvailable: boolean;

    @Field(() => Food)
    @ManyToOne(() => Food, (food) => food.toppings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'food_id' })
    food: Food;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}