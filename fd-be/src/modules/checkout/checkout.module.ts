import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { Checkout } from 'src/entities/checkout.entity';
import { Food } from 'src/entities/food.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GuardModule } from 'src/common/guard/guard.module';
import { Address } from 'src/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checkout, Food, Address]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    GuardModule
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, ConfigService],
  exports: [CheckoutService],
})
export class CheckoutModule { }
