import { Controller, Post, Body, UseGuards, Req, Param, Get, Query } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ShipperService } from './shipper.service';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

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

  @Get('pending-assignment')
  @UseGuards(AuthGuard)
  async getPendingAssignment(@Req() req) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.getPendingAssignmentForShipper(shipperId);
  }

  // Keep the original endpoint for backward compatibility


  @UseGuards(AuthGuard)
  @Get('order-history')
  async getHistory(@Req() req) {
    const shipperId = req.user.id || req.user.userId;
    return this.shipperService.getCompletedOrdersByShipper(shipperId);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    const userId = req.user.id || req.user.userId;
    return this.shipperService.getDriverProfile(userId);
  }


  @Get('income-report')
  @UseGuards(AuthGuard)
  async getIncomeReport(
    @Req() req,
    @Query('range') range: 'today' | 'week' | 'month',
    @Query('month') month?: string,
    @Query('year') year?: string,
) {
    const shipperId = req.user.id || req.user.uid;
    return this.shipperService.getIncomeReport(shipperId, range, month, year);
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