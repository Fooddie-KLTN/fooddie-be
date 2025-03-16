import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) {}

    async createOrder(data: CreateOrderDto) {
        const order = this.orderRepository.create(data);
        return await this.orderRepository.save(order);
    }

    async getAllOrders() {
        return await this.orderRepository.find({ relations: ['user', 'restaurant', 'orderDetails', 'shippingDetail', 'promotionCode', 'address'] });
    }

    async getOrderById(id: string) {
        const order = await this.orderRepository.findOne({ where: { id }, relations: ['user', 'orderDetails', 'shippingDetail'] });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async getOrdersByUser(userId: string) {
        return await this.orderRepository.find({ where: { user: { id: userId } }, relations: ['user'] });
    }

    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);
        order.status = status;
        return await this.orderRepository.save(order);
    }

    async deleteOrder(id: string) {
        const result = await this.orderRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Order not found');
        return { message: 'Order deleted successfully' };
    }
}
