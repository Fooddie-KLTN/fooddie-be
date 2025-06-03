import { Controller, Post, Body, UseGuards, Req, Param, Get } from '@nestjs/common';
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

  @Post('accept-assignment/:assignmentId')
  @UseGuards(AuthGuard)
  async acceptAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() req
  ) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.acceptAssignment(assignmentId, shipperId);
  }

  @Post('reject-assignment/:assignmentId')
  @UseGuards(AuthGuard)
  async rejectAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() req
  ) {
    const shipperId = req.user.uid || req.user.id;
    return this.shipperService.rejectAssignment(assignmentId, shipperId);
  }

}