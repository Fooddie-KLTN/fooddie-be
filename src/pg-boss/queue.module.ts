import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { Order } from 'src/entities/order.entity';
import { Address } from 'src/entities/address.entity';
import { Promotion } from 'src/entities/promotion.entity';
import { Category } from 'src/entities/category.entity';
import { Checkout } from 'src/entities/checkout.entity';
import { Food } from 'src/entities/food.entity';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Review } from 'src/entities/review.entity';
import { Role } from 'src/entities/role.entity';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { PendingAssignmentService } from './pending-assignment.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      ShippingDetail, 
      Order, 
      Address, 
      Promotion, 
      Food, 
      Restaurant, 
      Category, 
      OrderDetail, 
      Role, 
      Review, 
      Checkout,
      PendingShipperAssignment // Add the new entity
    ]),
  ], 
  providers: [
    QueueService, 
    GoogleCloudStorageService,
    PendingAssignmentService,
  ],
  exports: [QueueService, PendingAssignmentService],
})
export class QueueModule { }