import { Controller, Post, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { OrderDetailService } from './orderDetail.service';
import { CreateOrderDetailDto } from './dto/create-orderDetail.dto';
import { UpdateOrderDetailDto } from './dto/update-orderDetail.dto';

@Controller('order-details')
export class OrderDetailController {
    constructor(private readonly orderDetailService: OrderDetailService) {}

    @Post()
    createOrderDetail(@Body() createOrderDetailDto: CreateOrderDetailDto) {
        return this.orderDetailService.createOrderDetail(createOrderDetailDto);
    }

    @Get(':orderId')
    getOrderDetailsByOrder(@Param('orderId') orderId: string) {
        return this.orderDetailService.getOrderDetailsByOrder(orderId);
    }

    @Put(':id')
    updateOrderDetail(@Param('id') id: string, @Body() updateOrderDetailDto: UpdateOrderDetailDto) {
        return this.orderDetailService.updateOrderDetail(id, updateOrderDetailDto);
    }

    @Delete(':id')
    deleteOrderDetail(@Param('id') id: string) {
        return this.orderDetailService.deleteOrderDetail(id);
    }
}
