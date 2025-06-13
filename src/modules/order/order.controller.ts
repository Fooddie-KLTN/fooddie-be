import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Logger, BadRequestException, ForbiddenException, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaymentDto } from './dto/payment.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { PaymentService } from 'src/payment/payment.service';
import { pubSub } from 'src/pubsub'; // THÊM IMPORT NÀY
import { log } from 'console';
import { RestaurantService } from '../restaurant/restaurant.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly restaurantService: RestaurantService,
    private readonly pendingAssignmentService: PendingAssignmentService, // Inject the new service
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
  items: { foodId: string, quantity: number }[],
  promotionCode?: string // Add promotion code to calculation
}) {
  this.logger.log(`Calculating order: ${JSON.stringify(body)}`);

  if (!body.addressId || !body.restaurantId || !Array.isArray(body.items) || body.items.length === 0) {
    return { error: 'Missing addressId, restaurantId, or items' };
  }

  // Delegate to service with promotion code
  return this.orderService.calculateOrder({
    addressId: body.addressId,
    restaurantId: body.restaurantId,
    items: body.items,
    promotionCode: body.promotionCode
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

    // ADD ORDER TO PENDING ASSIGNMENTS WHEN STATUS CHANGES TO 'confirmed'
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      // Only add if order is not already assigned to a shipper
      if (!updatedOrder.shippingDetail) {
        try {
          await this.pendingAssignmentService.addPendingAssignment(id, 1);
          this.logger.log(`Added order ${id} to pending shipper assignments`);
        } catch (error) {
          this.logger.error(`Failed to add order ${id} to pending assignments: ${error.message}`);
        }
      } else {
        this.logger.log(`Order ${id} already assigned to shipper, not adding to pending assignments`);
      }
    }

    // REMOVE FROM PENDING ASSIGNMENTS if status changes from 'confirmed' to something else
    if (previousStatus === 'confirmed' && status !== 'confirmed') {
      try {
        await this.pendingAssignmentService.removePendingAssignment(id);
        this.logger.log(`Removed order ${id} from pending assignments due to status change`);
      } catch (error) {
        this.logger.error(`Failed to remove order ${id} from pending assignments: ${error.message}`);
      }
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

  @Post('validate-promotion')
  async validatePromotion(@Body() body: {
    promotionCode: string,
    addressId: string,
    restaurantId: string,
    items: { foodId: string, quantity: number }[]
  }) {
    this.logger.log(`Validating promotion: ${body.promotionCode}`);

    if (!body.promotionCode || !body.addressId || !body.restaurantId || !Array.isArray(body.items)) {
      return { 
        valid: false, 
        error: 'Missing required fields: promotionCode, addressId, restaurantId, or items' 
      };
    }

    return this.orderService.validatePromotionForOrder(
      body.promotionCode,
      body.addressId,
      body.restaurantId,
      body.items
    );
  }
}
