import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { Role } from 'src/entities/role.entity';
import { Food } from 'src/entities/food.entity';
import { UsersService } from '../users/users.service';
import { Address } from 'src/entities/address.entity';
import { Promotion } from 'src/entities/promotion.entity';
import { JwtModule } from '@nestjs/jwt';
import { Checkout } from 'src/entities/checkout.entity';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentModule } from 'src/payment/payment.module';
import { OrderResolver } from './order.resolver';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { PromotionService } from '../promotion/promotion.service';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { QueueModule } from 'src/pg-boss/queue.module';
import { Review } from 'src/entities/review.entity';
import { Notification } from 'src/entities/notification.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { SystemConstraint } from 'src/entities/systemConstaints.entity';
import { SystemConstraintsService } from 'src/services/system-constraints.service';
import { Topping } from 'src/entities/topping.entity';
import { MapboxService } from 'src/services/mapbox.service';


@Module({
    imports: [TypeOrmModule.forFeature([Order, User, Restaurant, OrderDetail, Role, Food, Address, Promotion, Checkout, Promotion,
        Review,
        Notification,
        ShippingDetail,
        SystemConstraint,
        Topping
    ]),
     JwtModule,
      PaymentModule,
       RestaurantModule,
    QueueModule,
    ],
    
    controllers: [OrderController],
    providers: [OrderService, UsersService, OrderResolver, PromotionService, GoogleCloudStorageService, SystemConstraintsService , MapboxService],
    exports: [OrderService],
})
export class OrderModule {}