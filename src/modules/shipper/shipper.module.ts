import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';
import { User } from 'src/entities/user.entity';
import { Order } from 'src/entities/order.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { UsersModule } from '../users/users.module';
import { OrderModule } from '../order/order.module';
import { JwtModule } from '@nestjs/jwt';
import { QueueModule } from 'src/pg-boss/queue.module';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { Certificate } from 'crypto';
import { ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';


@Module({
    imports: [TypeOrmModule.forFeature([User, Order, ShippingDetail, PendingShipperAssignment, ShipperCertificateInfo]), UsersModule, OrderModule, JwtModule, QueueModule] ,
    controllers: [ShipperController],
    providers: [ShipperService],
    exports: [ShipperService],
})
export class ShipperModule {}