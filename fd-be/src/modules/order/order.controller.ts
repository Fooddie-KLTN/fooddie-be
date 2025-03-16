import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    createOrder(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.createOrder(createOrderDto);
    }

    @Get()
    getAllOrders() {
        return this.orderService.getAllOrders();
    }

    @Get(':id')
    getOrderById(@Param('id') id: string) {
        return this.orderService.getOrderById(id);
    }

    @Get('user/:userId')
    getOrdersByUser(@Param('userId') userId: string) {
        return this.orderService.getOrdersByUser(userId);
    }

    @Put(':id/status')
    updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.orderService.updateOrderStatus(id, status);
    }

    @Delete(':id')
    deleteOrder(@Param('id') id: string) {
        return this.orderService.deleteOrder(id);
    }
}
