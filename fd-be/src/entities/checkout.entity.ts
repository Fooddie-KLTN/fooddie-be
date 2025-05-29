import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Food } from './food.entity';
import { Order } from './order.entity';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json'; // Bạn cần cài package này

export enum CheckoutStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Đăng ký enum với GraphQL
registerEnumType(CheckoutStatus, {
  name: 'CheckoutStatus',
});

@ObjectType() // Thêm decorator ObjectType
@Entity('checkouts')
export class Checkout {
  @Field(() => ID) // Thêm Field decorator
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  userId: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  paymentIntentId: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  paymentUrl: string;

  @Field(() => CheckoutStatus)
  @Column({
    type: 'enum',
    enum: CheckoutStatus,
    default: CheckoutStatus.PENDING,
  })
  status: CheckoutStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => Order, { nullable: true })
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
