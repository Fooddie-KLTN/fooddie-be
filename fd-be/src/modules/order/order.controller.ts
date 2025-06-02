import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, Req, Logger } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { PaymentDto } from './dto/payment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentService } from 'src/payment/payment.service';
import { log } from 'console';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService, // Inject PaymentService
  ) {}

  @Post()
  async createOrder(@Body() body: any) {
    this.logger.log(`Received order creation request: ${JSON.stringify(body)}`);

    // Map orderDetails if present
    const orderDetails = Array.isArray(body.orderDetails)
      ? body.orderDetails.map((detail: any) => ({
          foodId: detail.foodId,
          quantity: detail.quantity,
          price: detail.price,
          note: detail.note || '',
        }))
      : [];

    // Map to DTO
    const createOrderDto: CreateOrderDto = {
      userId: body.userId,
      restaurantId: body.restaurantId,
      addressId: body.addressId,
      total: body.total,
      note: body.note,
      paymentMethod: body.paymentMethod,
      orderDetails,
    };

    this.logger.log(`Creating order with DTO: ${JSON.stringify(createOrderDto)}`);

    // 1. Create the order
    const order = await this.orderService.createOrder(createOrderDto);

    this.logger.log(`Order created with ID: ${order.id}`);

    // 2. Immediately create checkout if paymentMethod is not 'cod'
    let paymentUrl: string | undefined = undefined;
    let checkoutId: string | undefined = undefined;
    if (body.paymentMethod && body.paymentMethod !== 'cod') {
      const checkout = await this.paymentService.createCheckout(order.id, body.paymentMethod);
      paymentUrl = checkout.paymentUrl;
      checkoutId = checkout.id;
      this.logger.log(`Checkout created for order ${order.id}: paymentUrl=${paymentUrl}, checkoutId=${checkoutId}`);
    }

    if (body.paymentMethod === 'cod') {
      this.logger.log(`Order ${order.id} will be paid on delivery (COD)`);
      order.status = 'pending'; // Set status to pending for COD
      // Update order status to pending if payment method is COD
      await this.orderService.updateOrderStatus(order.id, 'pending');
      paymentUrl = process.env.FRONTEND_URL + `/order/${order.id}`;
      
    }
    // 3. Return order info and paymentUrl (if any)
    return {
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt, // add/remove fields as needed
      },
      paymentUrl,
      checkoutId,
    };
  }

@Get('my')
@UseGuards(AuthGuard)
async getMyOrders(
  @Req() req,
  @Query('page') page: number = 1,
  @Query('pageSize') pageSize: number = 10,
  @Query('status') status?: string
) {
  const userId = req.user.uid || req.user.id;
  return this.orderService.getOrdersByUser(userId, page, pageSize, status);
}

  @Get()
  getAllOrders() {
    return this.orderService.getAllOrders();
  }
@Post('calculate')
async calculateOrder(@Body() body: { 
  addressId: string, 
  restaurantId: string, 
  items: { foodId: string, quantity: number }[] 
}) {
  this.logger.log(`Calculating order: ${JSON.stringify(body)}`);

  if (!body.addressId || !body.restaurantId || !Array.isArray(body.items) || body.items.length === 0) {
    return { error: 'Missing addressId, restaurantId, or items' };
  }

  // Delegate to service
  return this.orderService.calculateOrder({
    addressId: body.addressId,
    restaurantId: body.restaurantId,
    items: body.items,
  });
}

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get('user/:userId')
  getOrdersByUser(@Param('userId') userId: string) {
    return this.orderService.getOrdersByUser(userId);
  }

  @Get(':id/details')
  getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(id);
  }

  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(id, status);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }

  @Post(':id/payment')
  processPayment(
    @Param('id') id: string,
    @Body() paymentData: PaymentDto
  ) {
    return this.orderService.processPayment(id, paymentData);
  }
}
