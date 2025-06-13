import { Controller, Post, Body, UseGuards, Req, Param, Get, Query } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ShipperService } from './shipper.service';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Post('request-order')
  @UseGuards(AuthGuard)
  async requestOrder(
    @Body('orderId') orderId: string,
    @Req() req
  ) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.requestOrderAssignment(orderId, shipperId);
  }

  @Get('pending-assignment')
  @UseGuards(AuthGuard)
  async getPendingAssignment(@Req() req) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.getPendingAssignmentForShipper(shipperId);
  }

  // Keep the original endpoint for backward compatibility
  @Post('accept-order')
  @UseGuards(AuthGuard)
  async acceptOrder(
    @Body('orderId') orderId: string,
    @Req() req
  ) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.assignOrderToShipper(orderId, shipperId);
  }

  @UseGuards(AuthGuard)
  @Post('complete-order')
  async completeOrder(@Body('orderId') orderId: string, @Req() req) {
    const userId = req.user?.userId || req.user?.uid || req.user?.id;
    return this.shipperService.markOrderCompleted(orderId, userId);
  }

  @UseGuards(AuthGuard)
  @Get('order-history')
  async getHistory(@Req() req) {
    const shipperId = req.user.id || req.user.userId;
    return this.shipperService.getCompletedOrdersByShipper(shipperId);
  }


  // @Get('order-history')
  // @UseGuards(AuthGuard)  // Bảo vệ API bằng AuthGuard
  // async getOrderHistory(
  //   @Req() req, 
  //   @Query('page') page: number = 1,
  //   @Query('pageSize') pageSize: number = 10
  // ) {
  //   const shipperId = req.user.uid || req.user.id;
  //   return this.shipperService.getOrderHistoryForShipper(shipperId, page, pageSize);
  // }

}