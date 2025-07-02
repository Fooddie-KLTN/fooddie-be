import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { FoodService } from '../food/food.service';
import { OrderService } from '../order/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from 'src/entities/food.entity';
import { Order } from 'src/entities/order.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Category } from 'src/entities/category.entity';
import { Review } from 'src/entities/review.entity';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { User } from 'src/entities/user.entity';
import { Address } from 'src/entities/address.entity';
import { Promotion } from 'src/entities/promotion.entity';
import { Checkout } from 'src/entities/checkout.entity';
import { PromotionService } from '../promotion/promotion.service';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { QueueService } from 'src/pg-boss/queue.service';

import { Notification } from 'src/entities/notification.entity';
import { OrderModule } from '../order/order.module';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';

import { AddressService } from '../address/address.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { GeocodingService } from 'src/services/geocoding.service';
import { SystemConstraintsService } from 'src/services/system-constraints.service';
import { SystemConstraint } from 'src/entities/systemConstaints.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Food,
    SystemConstraint, Order, Restaurant, Category, Review, OrderDetail, User, Address, Promotion, Checkout, PendingShipperAssignment, Notification, ShippingDetail]),
  OrderModule
], 
  controllers: [ChatController],
  providers: [ChatService, SystemConstraintsService,
    JwtModule, FoodService, OrderService, GoogleCloudStorageService, PromotionService, PendingAssignmentService, QueueService, JwtService, AddressService, RestaurantService, GeocodingService],
})
export class ChatModule {}
