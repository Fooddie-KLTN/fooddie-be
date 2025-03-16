import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderDetailService } from './orderDetail.service';
import { OrderDetailController } from './orderDetail.controller';
import { OrderDetail } from 'src/entities/orderDetail.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OrderDetail])],
    controllers: [OrderDetailController],
    providers: [OrderDetailService],
    exports: [OrderDetailService],
})
export class OrderDetailModule {}
