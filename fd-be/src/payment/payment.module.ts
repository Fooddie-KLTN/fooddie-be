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

@Module({
	imports: [
		TypeOrmModule.forFeature([Order, OrderDetail, Checkout, User,Food, Role, Promotion]),
		ConfigModule,
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
	providers: [PaymentService, MomoPaymentGateway, OrderService, UsersService, PromotionService, VnpayPaymentGateway],
	exports: [PaymentService],
})
export class PaymentModule { } 