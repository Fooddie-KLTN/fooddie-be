import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from 'src/entities/user.entity';
import { Order } from 'src/entities/order.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { OrderModule } from '../order/order.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, ShippingDetail]),
    UsersModule, // Assuming UserModule is defined elsewhere
    OrderModule, // Assuming OrderModule is defined elsewhere   
    JwtModule
  
],
  controllers: [DashboardController],
  providers: [DashboardService, ],
  exports: [DashboardService],
})
export class DashboardModule {}