import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Order } from '../entities/order.entity';
import { OrderDetail } from '../entities/orderDetail.entity';
import { Checkout } from '../entities/checkout.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MomoPaymentGateway } from './gateways/momo-payment.gateway';
import { DemoPaymentController } from './demo-payment.controller';
import { OrderService } from 'src/modules/order/order.service';
import { User } from 'src/entities/user.entity';
import { Food } from 'src/entities/food.entity';
import { UsersService } from 'src/modules/users/users.service';
import { Promotion } from 'src/entities/promotion.entity';
import { PromotionService } from 'src/modules/promotion/promotion.service';
import { Role } from 'src/entities/role.entity';
import { VnpayPaymentGateway } from './gateways/vnpay-payment.gateway';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Address } from 'src/entities/address.entity';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';
import { QueueModule } from 'src/pg-boss/queue.module';
import { Review } from 'src/entities/review.entity';
import { Notification } from 'src/entities/notification.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Order, OrderDetail, Checkout, User,Food, Role, Promotion, Restaurant, Address, Promotion, Review, Notification]),
		ConfigModule,
		QueueModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '1d' },
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [PaymentController, DemoPaymentController],
	providers: [PaymentService, MomoPaymentGateway,PromotionService, OrderService, UsersService, PromotionService, VnpayPaymentGateway, GoogleCloudStorageService ],
	exports: [PaymentService],
})
export class PaymentModule { } 