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

@Module({
    imports: [TypeOrmModule.forFeature([Order, User, Restaurant, OrderDetail, Role, Food, Address, Promotion, Checkout]), JwtModule, PaymentModule],
    controllers: [OrderController],
    providers: [OrderService, UsersService, OrderResolver],
    exports: [OrderService],
})
export class OrderModule {}