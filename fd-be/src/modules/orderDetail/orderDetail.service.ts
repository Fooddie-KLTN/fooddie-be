import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { CreateOrderDetailDto } from './dto/create-orderDetail.dto';
import { UpdateOrderDetailDto } from './dto/update-orderDetail.dto';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
    ) {}

    async createOrderDetail(data: CreateOrderDetailDto) {
        const orderDetail = this.orderDetailRepository.create(data);
        return await this.orderDetailRepository.save(orderDetail);
    }

    async getOrderDetailsByOrder(orderId: string) {
        return await this.orderDetailRepository.find({
            where: { order: { id: orderId } },
            relations: ['food', 'order'],
        });
    }

    async updateOrderDetail(id: string, data: UpdateOrderDetailDto) {
        await this.orderDetailRepository.update(id, data);
        return this.getOrderDetailsByOrder(id);
    }

    async deleteOrderDetail(id: string) {
        const result = await this.orderDetailRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Order Detail not found');
        return { message: 'Order Detail deleted successfully' };
    }
}
