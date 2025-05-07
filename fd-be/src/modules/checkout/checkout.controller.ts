import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckoutStatus } from 'src/entities/checkout.entity';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('checkout')
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  @Post()
  async createCheckout(
    @Request() req,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return this.checkoutService.createCheckout(req.user, createCheckoutDto);
  }

  @Get(':id')
  async getCheckout(@Request() req, @Param('id') id: string) {
    return this.checkoutService.getCheckoutById(id, req.user);
  }

  @Get()
  async getUserCheckouts(@Request() req) {
    return this.checkoutService.getUserCheckouts(req.user);
  }

  @Post(':id/status')
  async updateCheckoutStatus(
    @Param('id') id: string,
    @Body('status') status: CheckoutStatus,
    @Body('paymentIntentId') paymentIntentId?: string,
  ) {
    return this.checkoutService.updateCheckoutStatus(
      id,
      status,
      paymentIntentId,
    );
  }
}
