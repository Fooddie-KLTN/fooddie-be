import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/orderDetail.entity';
import { CreateOrderDto, CreateOrderDetailDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/entities/user.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Food } from 'src/entities/food.entity';
import { Address } from 'src/entities/address.entity';
import { Promotion, PromotionType } from 'src/entities/promotion.entity';
import { PaymentDto } from './dto/payment.dto';
import { log } from 'console';
import { haversineDistance } from 'src/common/utils/helper';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Checkout, CheckoutStatus } from 'src/entities/checkout.entity';
import { pubSub } from 'src/pubsub';
import { PromotionService } from '../promotion/promotion.service';
import { PendingAssignmentService } from 'src/pg-boss/pending-assignment.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(Address)
        private addressRepository: Repository<Address>,
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
        private dataSource: DataSource,
        @InjectRepository(Checkout)
        private checkoutRepository: Repository<Checkout>,
        private promotionService: PromotionService, // Add promotion service
        private pendingAssignmentService: PendingAssignmentService,
    ) { }

    private async validateAndCalculateOrderDetails(
        orderDetails: { foodId: string; quantity: string }[],
    ): Promise<{ calculatedTotal: number; foodDetails: { food: Food; quantity: number }[] }> {
        let calculatedTotal = 0;
        const foodDetails: { food: Food; quantity: number }[] = [];

        for (const detail of orderDetails) {
            const food = await this.foodRepository.findOne({ where: { id: detail.foodId } });
            if (!food) throw new NotFoundException(`Food with ID ${detail.foodId} not found`);
            const price = Number(food.price) * Number(detail.quantity);
            calculatedTotal += price;
            foodDetails.push({ food, quantity: Number(detail.quantity) });
        }

        return { calculatedTotal, foodDetails };
    }

    private async createOrderDetails(
        order: Order,
        foodDetails: { food: Food; quantity: number }[],
        queryRunner: any,
    ): Promise<void> {
        for (const detail of foodDetails) {
            const orderDetail = new OrderDetail();
            orderDetail.order = order;
            orderDetail.food = detail.food;
            orderDetail.quantity = detail.quantity;
            orderDetail.price = String(detail.food.price);
            await queryRunner.manager.save(OrderDetail, orderDetail);
        }
    }

    async createOrder(data: CreateOrderDto) {
        this.logger.log(`Starting order creation for user ${data.userId} at restaurant ${data.restaurantId}`);

        // Validate order details
        if (!data.orderDetails || data.orderDetails.length === 0) {
            this.logger.warn('Order creation failed: No order details provided');
            throw new BadRequestException('Order must contain at least one item');
        }

        // Use a transaction to ensure data consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find related entities
            const user = await queryRunner.manager.findOne(User, { where: { id: data.userId } });
            if (!user) {
                this.logger.warn(`User not found: ${data.userId}`);
                throw new NotFoundException('User not found');
            }

            const restaurant = await queryRunner.manager.findOne(Restaurant, { where: { id: data.restaurantId } });
            if (!restaurant) {
                this.logger.warn(`Restaurant not found: ${data.restaurantId}`);
                throw new NotFoundException('Restaurant not found');
            }

            const address = await queryRunner.manager.findOne(Address, { where: { id: data.addressId } });
            if (!address) {
                this.logger.warn(`Address not found: ${data.addressId}`);
                throw new NotFoundException('Address not found');
            }

            // Calculate total and validate food
            const { calculatedTotal, foodDetails } = await this.validateAndCalculateOrderDetails(data.orderDetails);
            this.logger.log(`Validated order details. Calculated total: ${calculatedTotal}`);

            // Calculate order totals with promotion
            const orderCalculation = await this.calculateOrder({
                addressId: data.addressId,
                restaurantId: data.restaurantId,
                items: data.orderDetails.map(item => ({
                    foodId: item.foodId,
                    quantity: Number(item.quantity),
                })),
                promotionCode: data.promotionCode
            });

            // Check if promotion validation failed
            if (data.promotionCode && orderCalculation.promotionError) {
                throw new BadRequestException(orderCalculation.promotionError);
            }

            this.logger.log(`Order total calculated: ${orderCalculation.total}`);

            // Find promotion if code was provided and valid
            let promotion: Promotion | null = null;
            if (data.promotionCode && orderCalculation.appliedPromotion) {
                promotion = await queryRunner.manager.findOne(Promotion, { 
                    where: { code: data.promotionCode } 
                });
            }

            // Create order
            const order = new Order();
            order.user = user;
            order.restaurant = restaurant;
            order.total = orderCalculation.total;
            order.note = data.note || '';
            order.address = address;
            order.date = new Date().toISOString();
            if (promotion) {
                order.promotionCode = promotion; // Set promotion if applicable
            }
            
            if (data.paymentMethod && data.paymentMethod !== 'cod') {
                order.status = 'pending';
            } else {
                order.status = 'processing_payment';
            }
            order.paymentMethod = data.paymentMethod || 'cod';

            const savedOrder = await queryRunner.manager.save(Order, order);
            this.logger.log(`Order entity saved with ID: ${savedOrder.id}`);

            // Create order details
            await this.createOrderDetails(savedOrder, foodDetails, queryRunner);
            this.logger.log(`Order details saved for order ID: ${savedOrder.id}`);

            // Use promotion if applied
            if (promotion) {
                await this.promotionService.usePromotion(promotion.code, orderCalculation.subtotal);
                this.logger.log(`Promotion ${promotion.code} applied to order ${savedOrder.id}`);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Order transaction committed for order ID: ${savedOrder.id}`);

            return await this.getOrderById(savedOrder.id);
        } catch (error) {
            this.logger.error(`Order creation failed: ${error.message}`, error.stack);
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getAllOrders() {
        return await this.orderRepository.find({
            relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.food', 'shippingDetail', 'promotionCode', 'address']
        });
    }

    async getOrderById(id: string) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'user',
                'restaurant',
                'orderDetails',
                'orderDetails.food',
                'shippingDetail',
                'promotionCode',
                'address'
            ]
        });

        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async getOrdersByUser(
        userId: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string
    ) {
        const query = this.orderRepository.createQueryBuilder('order')
            .leftJoin('order.restaurant', 'restaurant')
            .select([
                'order.id',
                'order.status',
                'order.total',
                'order.createdAt',
                'order.paymentMethod',
                'restaurant.id',
                'restaurant.name'
            ])
            .where('order.user = :userId', { userId });

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        query
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, totalItems] = await query.getManyAndCount();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
    async getOrdersByRestaurant(
        restaurantId: string,
        page: number = 1,
        pageSize: number = 10,
        status?: string
    ) {
        const query = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.restaurant', 'restaurant')
            .leftJoinAndSelect('order.address', 'address')
            .leftJoinAndSelect('order.orderDetails', 'orderDetails')
            .leftJoinAndSelect('orderDetails.food', 'food')
            .leftJoinAndSelect('food.category', 'category')
            .where('order.restaurant.id = :restaurantId', { restaurantId })
            .orderBy('order.createdAt', 'DESC');

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        const [items, totalItems] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return {
            items,
            totalItems,
            page,
            pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
        };
    }
    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);

        // Validate status transitions
        const validStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'canceled', 'processing_payment'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Invalid status. Valid values are: ${validStatuses.join(', ')}`);
        }

        // Check if status transition is valid
        const currentStatus = order.status;
        const validTransitions: Record<string, string[]> = {
            'pending': ['confirmed', 'canceled'],
            'confirmed': ['delivering', 'canceled'],
            'delivering': ['completed', 'canceled'],
            'processing_payment': ['pending', 'canceled']
        };
        
        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
            throw new BadRequestException(`Cannot change status from ${currentStatus} to ${status}`);
        }

        order.status = status;
        const updatedOrder = await this.orderRepository.save(order);

        // Publish event for status changes (not just pending)
        await pubSub.publish('orderStatusUpdated', {
            orderStatusUpdated: updatedOrder
        });
        
        this.logger.log(`Order ${id} status updated to ${status}`);

        return updatedOrder;
    }

    async confirmOrder(orderId: string, restaurantOwnerId: string): Promise<Order> {
        this.logger.log(`Confirming order ${orderId} for restaurant owner ${restaurantOwnerId}`);

        const order = await this.getOrderById(orderId);

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Only confirm if order is in pending state
        if (order.status !== 'pending') {
            throw new BadRequestException(`Order is not in a confirmable state`);
        }

        // Update order status
        order.status = 'confirmed';
        const confirmedOrder = await this.orderRepository.save(order);

        this.logger.log(`Order ${orderId} status updated to confirmed`);

        try {
            // Create pending shipper assignment - this will be picked up by the automated system
            const pendingAssignment = await this.pendingAssignmentService.addPendingAssignment(
                confirmedOrder.id,
                1 // Priority: 1 = normal, higher numbers = higher priority
            );

            this.logger.log(`Created pending shipper assignment ${pendingAssignment.id} for order ${orderId}`);
            this.logger.log(`Automated system will find and notify nearby shippers for order ${orderId}`);

            return confirmedOrder;
        } catch (error) {
            this.logger.error(`Failed to create pending shipper assignment for order ${orderId}:`, error);
            
            // Don't fail the order confirmation, just log the error
            // The assignment can be created manually or through retry mechanisms
            this.logger.warn(`Order ${orderId} confirmed but shipper assignment failed - manual intervention may be required`);
            
            return confirmedOrder;
        }
    }

    async calculateOrder(data: {
        addressId: string,
        restaurantId: string,
        items: { foodId: string, quantity: number }[],
        promotionCode?: string // Add optional promotion code
    }) {
        // 1. Fetch address and restaurant (with coordinates)
        const address = await this.addressRepository.findOne({ where: { id: data.addressId } });
        const restaurant = await this.restaurantRepository.findOne({ where: { id: data.restaurantId }, relations: ['address'] });

        if (!address || !restaurant || !restaurant.address) {
            throw new Error('Invalid address or restaurant');
        }

        // 2. Calculate distance
        const distance = haversineDistance(
            Number(address.latitude),
            Number(address.longitude),
            Number(restaurant.address.latitude),
            Number(restaurant.address.longitude)
        );

        // 3. Calculate shipping fee
        const shippingFee = distance <= 2 ? 15000 : 15000 + Math.ceil(distance - 2) * 5000;

        // 4. Calculate food total
        let foodTotal = 0;
        for (const item of data.items) {
            const food = await this.foodRepository.findOne({ where: { id: item.foodId } });
            if (!food) continue;
            foodTotal += Number(food.price) * item.quantity;
        }

        let promotionDiscount = 0;
        let appliedPromotion: Promotion | null = null;
        let promotionError: string | null = null;

        // 5. Apply promotion if provided
        if (data.promotionCode) {
            try {
                const promotionValidation = await this.promotionService.validatePromotion(
                    data.promotionCode, 
                    foodTotal + shippingFee
                );

                if (promotionValidation.valid && promotionValidation.promotion) {
                    appliedPromotion = promotionValidation.promotion;
                    
                    // Calculate discount based on promotion type
                    if (appliedPromotion.type === PromotionType.FOOD_DISCOUNT) {
                        // Apply discount to food total only
                        promotionDiscount = this.promotionService.calculateDiscount(appliedPromotion, foodTotal);
                    } else if (appliedPromotion.type === PromotionType.SHIPPING_DISCOUNT) {
                        // Apply discount to shipping fee only
                        promotionDiscount = Math.min(
                            this.promotionService.calculateDiscount(appliedPromotion, shippingFee),
                            shippingFee // Don't exceed shipping fee
                        );
                    }
                } else {
                    promotionError = promotionValidation.reason || 'Invalid promotion code';
                }
            } catch (error) {
                promotionError = 'Failed to validate promotion code';
                this.logger.error(`Promotion validation error: ${error.message}`);
            }
        }

        // 6. Calculate final total
        const subtotal = foodTotal + shippingFee;
        const total = Math.max(0, subtotal - promotionDiscount); // Ensure total is not negative

        return {
            foodTotal,
            shippingFee,
            distance: Number(distance.toFixed(2)),
            subtotal,
            promotionDiscount,
            total,
            appliedPromotion: appliedPromotion ? {
                id: appliedPromotion.id,
                code: appliedPromotion.code,
                description: appliedPromotion.description,
                type: appliedPromotion.type,
                discountAmount: promotionDiscount
            } : null,
            promotionError
        };
    }

    async deleteOrder(id: string) {
        // First make sure the order exists
        const order = await this.getOrderById(id);

        // Use a transaction for deleting order and details
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete associated order details
            if (order.orderDetails && order.orderDetails.length > 0) {
                await queryRunner.manager.delete(OrderDetail, {
                    order: { id: order.id }
                });
            }

            // Delete the order
            await queryRunner.manager.delete(Order, id);

            await queryRunner.commitTransaction();

            return { message: 'Order and its details deleted successfully' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async processPayment(orderId: string, paymentData: PaymentDto) {
        const order = await this.getOrderById(orderId);

        if (order.status !== 'pending') {
            throw new BadRequestException('Cannot process payment for an order that is not pending');
        }

        // Use a transaction for payment processing
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate payment data
            if (!paymentData.method) {
                throw new BadRequestException('Payment method is required');
            }

            // Here you would integrate with a real payment gateway
            // For demonstration, we'll just simulate different payment results

            let paymentSuccess = true;
            let paymentMessage = 'Payment processed successfully';

            // Simulate payment processing based on method
            switch (paymentData.method) {
                case 'credit_card':
                    // Validate credit card info
                    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
                        throw new BadRequestException('Credit card information is incomplete');
                    }
                    // Additional validation would happen here in a real system
                    break;

                case 'paypal':
                    // Verify paypal token or account
                    if (!paymentData.paypalToken) {
                        throw new BadRequestException('PayPal token is required');
                    }
                    break;

                case 'cash':
                    // Cash on delivery, no validation needed
                    break;

                default:
                    throw new BadRequestException('Unsupported payment method');
            }

            // Update order status based on payment result
            if (paymentSuccess) {
                // For cash payments, set to processing
                if (paymentData.method === 'cash') {
                    order.status = 'processing';
                } else {
                    // For electronic payments, you might set to 'paid' or 'processing'
                    order.status = 'processing';
                }

                // Store payment details (in a real system, this would be in a Payment entity)
                order.paymentMethod = paymentData.method;
                order.paymentDate = new Date().toISOString();

                await this.orderRepository.save(order);

                await queryRunner.commitTransaction();

                return {
                    success: true,
                    message: paymentMessage,
                    order: await this.getOrderById(orderId)
                };
            } else {
                throw new BadRequestException('Payment failed');
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    // Get order details for a specific order
    async getOrderDetails(orderId: string) {
        const order = await this.getOrderById(orderId);
        return order.orderDetails;
    }
    /**
 * Confirm payment for an order
 * @param orderId The ID of the order to confirm payment for
 * @returns The updated order
 */
    async confirmPayment(orderId: string): Promise<Order> {
        log(`Confirming payment for order ${orderId}`);

        const order = await this.getOrderById(orderId);

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Only confirm payment if order is in pending or processing status
        if (order.status !== 'pending' && order.status !== 'processing') {
            throw new BadRequestException(`Cannot confirm payment for an order with status ${order.status}`);
        }

        // Update order status and payment details
        order.status = 'completed';
        order.isPaid = true;
        order.paymentDate = new Date().toISOString();

        // Save the updated order
        const updatedOrder = await this.orderRepository.save(order);

        log(`Payment confirmed for order ${orderId}`);

        // You could add additional logic here, like:
        // - Sending confirmation email
        // - Updating inventory
        // - Recording the transaction

        return updatedOrder;
    }

    // Runs every 10 minutes
    @Cron(CronExpression.EVERY_10_MINUTES)
    async autoCancelStuckOrders() {
        const timeoutMinutes = 15;
        const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        // Find stuck orders
        const stuckOrders = await this.orderRepository.find({
            where: {
                status: 'processing_payment',
                createdAt: LessThan(timeoutDate),
            },
        });

        if (stuckOrders.length) {
            this.logger.log(`Auto-canceling ${stuckOrders.length} stuck orders...`);
        }

        for (const order of stuckOrders) {
            order.status = 'canceled';
            await this.orderRepository.save(order);

            // Optionally, update related checkout status
            const checkout = await this.checkoutRepository.findOne({ where: { orderId: order.id } });
            if (checkout && checkout.status !== CheckoutStatus.COMPLETED && checkout.status !== CheckoutStatus.CANCELLED) {
                checkout.status = CheckoutStatus.CANCELLED;
                await this.checkoutRepository.save(checkout);
            }

            this.logger.log(`Order ${order.id} auto-canceled due to payment timeout.`);
        }
    }

    // Add method to validate promotion for an order
    async validatePromotionForOrder(
        promotionCode: string,
        addressId: string,
        restaurantId: string,
        items: { foodId: string, quantity: number }[]
    ) {
        const orderCalculation = await this.calculateOrder({
            addressId,
            restaurantId,
            items,
            promotionCode
        });

        return {
            valid: !orderCalculation.promotionError,
            promotion: orderCalculation.appliedPromotion,
            discount: orderCalculation.promotionDiscount,
            error: orderCalculation.promotionError,
            orderTotal: orderCalculation.total
        };
    }
    
    async getOrderHistory(userId: string, page: number = 1, pageSize: number = 10) {
        // Tạo query để lấy các đơn hàng của người dùng
        const query = this.orderRepository.createQueryBuilder('order')
          .leftJoinAndSelect('order.orderDetails', 'orderDetail') // Lấy thông tin chi tiết món ăn
          .leftJoinAndSelect('orderDetail.food', 'food') // Lấy thông tin món ăn từ orderDetails
          .where('order.user_id = :userId', { userId })
          .orderBy('order.createdAt', 'DESC'); // Sắp xếp theo ngày tạo đơn hàng (mới nhất lên đầu)
      
        // Áp dụng phân trang
        const [orders, totalOrders] = await query
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getManyAndCount();
      
        // Chuyển đổi và trả về dữ liệu
        const ordersHistory = orders.map(order => ({
          orderId: order.id,
          restaurantName: order.restaurant?.name,
          totalAmount: order.total,
          status: order.status,
          date: order.createdAt,
          orderDetails: order.orderDetails.map(orderDetail => ({
            foodName: orderDetail.food.name,
            quantity: orderDetail.quantity,
            price: orderDetail.price,
            totalPrice: (parseFloat(orderDetail.price) * orderDetail.quantity).toFixed(2),
          })),
        }));
      
        return {
          items: ordersHistory,
          totalItems: totalOrders,
          page,
          pageSize,
          totalPages: Math.ceil(totalOrders / pageSize),
        };
      }
      

    // Add new cron job to auto-cancel orders without shippers
    @Cron(CronExpression.EVERY_10_MINUTES)
    async autoCancelUnassignedOrders() {
        const timeoutMinutes = 30; // Cancel orders after 30 minutes without shipper
        const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        this.logger.log(`🔍 Checking for pending assignments older than ${timeoutMinutes} minutes...`);

        // Find pending assignments that are too old
        const expiredAssignments = await this.pendingAssignmentService.getExpiredAssignments(timeoutDate);

        if (expiredAssignments.length > 0) {
            this.logger.log(`🚫 Found ${expiredAssignments.length} expired assignments to cancel`);
        }

        for (const assignment of expiredAssignments) {
            try {
                const order = assignment.order;
                
                // Double-check order is still confirmed and unassigned
                if (order.status !== 'confirmed') {
                    this.logger.log(`⏭️ Skipping order ${order.id} - status already changed to ${order.status}`);
                    continue;
                }

                // Check if order already has a shipper
                const currentOrder = await this.orderRepository.findOne({
                    where: { id: order.id },
                    relations: ['shippingDetail']
                });

                if (currentOrder?.shippingDetail) {
                    this.logger.log(`⏭️ Skipping order ${order.id} - already assigned to shipper`);
                    // Clean up the pending assignment
                    await this.pendingAssignmentService.removePendingAssignment(order.id);
                    continue;
                }

                // Update order status to canceled
                order.status = 'canceled';
                await this.orderRepository.save(order);

                // Remove the pending assignment
                await this.pendingAssignmentService.removePendingAssignmentById(assignment.id);

                // Publish event for order cancellation
                await pubSub.publish('orderStatusUpdated', {
                    orderStatusUpdated: order
                });

                // Calculate how long the assignment was pending
                const pendingDuration = Math.round((Date.now() - assignment.createdAt.getTime()) / (1000 * 60));
                
                this.logger.log(`❌ Auto-canceled order ${order.id} (${order.restaurant?.name}) - pending for ${pendingDuration} minutes without shipper`);

                // Optional: Send notifications
                await this.notifyOrderCancellation(order, 'No delivery driver available in your area');

            } catch (error) {
                this.logger.error(`❌ Failed to auto-cancel order ${assignment.order.id}:`, error);
            }
        }

        if (expiredAssignments.length > 0) {
            this.logger.log(`🎯 Auto-cancellation completed: ${expiredAssignments.length} orders canceled`);
        }
    }

    /**
     * Send notifications for order cancellation
     */
    private async notifyOrderCancellation(order: Order, reason: string = 'No shipper available'): Promise<void> {
        try {
            this.logger.log(`📧 Order ${order.id} canceled: ${reason}`);
            
            // Add your notification logic here:
            // - Email notifications
            // - Push notifications  
            // - SMS notifications
            // - In-app notifications
            
            this.logger.log(`✅ Cancellation notifications processed for order ${order.id}`);

        } catch (error) {
            this.logger.error(`❌ Failed to send cancellation notifications for order ${order.id}:`, error);
        }
    }

    
}