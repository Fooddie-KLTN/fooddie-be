import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, Req, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { PaymentDto } from './dto/payment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentService } from 'src/payment/payment.service';
import { pubSub } from 'src/pubsub'; // THÊM IMPORT NÀY
import { log } from 'console';
import { RestaurantService } from '../restaurant/restaurant.service';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService, // Inject PaymentService
    private readonly restaurantService: RestaurantService, // Inject RestaurantService
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
      
      // THÊM PUBLISH EVENT KHI STATUS CHUYỂN THÀNH PENDING
      const updatedOrder = await this.orderService.getOrderById(order.id);
      await pubSub.publish('orderCreated', { 
        orderCreated: updatedOrder 
      });
      this.logger.log(`Published orderCreated event for order ${order.id} with status pending`);
      
      paymentUrl = process.env.FRONTEND_URL + `/order/${order.id}`;
    }

    // 3. Return order info and paymentUrl (if any)
    return {
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
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

  @Get('restaurant/my')
@UseGuards(AuthGuard)
async getOrdersByMyRestaurant(
  @Req() req,
  @Query('page') page: number = 1,
  @Query('pageSize') pageSize: number = 10,
  @Query('status') status?: string
) {
  this.logger.log(`Getting orders for restaurant owned by user: ${req.user.uid || req.user.id}`);
  const userId = req.user.uid || req.user.id;
  
  // Get restaurant owned by this user
  const userRestaurant = await this.restaurantService.findByOwnerId(userId);
  if (!userRestaurant) {
    throw new ForbiddenException('You do not own any restaurant');
  }
  
  return this.orderService.getOrdersByRestaurant(userRestaurant.id, page, pageSize, status);
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
  @UseGuards(AuthGuard)
  async updateOrderStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Req() req
  ) {
    // Get authenticated user
    const userId = req.user.uid || req.user.id;
    
    // Get order with restaurant details BEFORE update
    const currentOrder = await this.orderService.getOrderById(id);
    const previousStatus = currentOrder.status;
    
    // Check if user owns the restaurant of this order
    const userRestaurant = await this.restaurantService.findByOwnerId(userId);
    if (!userRestaurant || userRestaurant.id !== currentOrder.restaurant.id) {
      throw new ForbiddenException('You can only update orders for your own restaurant');
    }

    if (!status) {
      throw new BadRequestException('Status is required');
    }

    // Only allow specific status transitions
    const allowedStatuses = ['confirmed', 'delivering', 'completed', 'canceled'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
    
    // Update order status
    const updatedOrder = await this.orderService.updateOrderStatus(id, status);
    
    // PUBLISH EVENT TO NOTIFY USER ABOUT STATUS CHANGE
    await pubSub.publish('orderStatusUpdated', {
      orderStatusUpdated: updatedOrder
    });

    // PUBLISH TO SHIPPERS ONLY WHEN CHANGING TO 'confirmed' STATUS
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      // Only publish if order is not already assigned to a shipper
      if (!updatedOrder.shippingDetail) {
        await pubSub.publish('orderConfirmedForShippers', {
          orderConfirmedForShippers: updatedOrder
        });
        this.logger.log(`Published order ${id} to nearby shippers for delivery`);
      } else {
        this.logger.log(`Order ${id} already assigned to shipper, not publishing`);
      }
    }

    // STOP PUBLISHING TO SHIPPERS if status changes from 'confirmed' to something else
    if (previousStatus === 'confirmed' && status !== 'confirmed') {
      await pubSub.publish('orderRemovedFromShippers', {
        orderRemovedFromShippers: { orderId: id }
      });
      this.logger.log(`Order ${id} removed from shipper pool due to status change from ${previousStatus} to ${status}`);
    }

    this.logger.log(`Order ${id} status updated to ${status} by restaurant owner ${userId}. User ${updatedOrder.user.id} notified.`);
    
    return updatedOrder;
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
