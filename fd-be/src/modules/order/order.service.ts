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
import { Promotion } from 'src/entities/promotion.entity';
import { PaymentDto } from './dto/payment.dto';
import { log } from 'console';
import { haversineDistance } from 'src/common/utils/helper';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Checkout, CheckoutStatus } from 'src/entities/checkout.entity';

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

            const totalPrice = await this.calculateOrder({
                addressId: data.addressId,
                restaurantId: data.restaurantId,
                items: data.orderDetails.map(item => ({
                    foodId: item.foodId,
                    quantity: Number(item.quantity),
                })),
            });
            this.logger.log(`Order total calculated: ${totalPrice.total}`);
            // Create order
            const order = new Order();
            order.user = user;
            order.restaurant = restaurant;
            order.total = totalPrice.total;
            order.note = data.note || '';
            order.address = address;
            order.date = new Date().toISOString();
            if (data.paymentMethod && data.paymentMethod !== 'cod') {
                order.status = 'pending';
            }
            else
                order.status = 'processing_payment';
            order.paymentMethod = data.paymentMethod || 'cod'; // Default to cash on delivery

            const savedOrder = await queryRunner.manager.save(Order, order);
            this.logger.log(`Order entity saved with ID: ${savedOrder.id}`);

            // Create order details
            await this.createOrderDetails(savedOrder, foodDetails, queryRunner);
            this.logger.log(`Order details saved for order ID: ${savedOrder.id}`);

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
    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'canceled', 'processing_payment'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Invalid status. Valid values are: ${validStatuses.join(', ')}`);
        }

        order.status = status;
        return await this.orderRepository.save(order);
    }

    async calculateOrder(data: {
        addressId: string,
        restaurantId: string,
        items: { foodId: string, quantity: number }[]
    }) {
        // 1. Fetch address and restaurant (with coordinates)
        const address = await this.addressRepository.findOne({ where: { id: data.addressId } });
        const restaurant = await this.restaurantRepository.findOne({ where: { id: data.restaurantId }, relations: ['address'] });

        if (!address || !restaurant || !restaurant.address) {
            throw new Error('Invalid address or restaurant');
        }

        // 2. Calculate distance (implement haversineDistance or similar)
        const distance = haversineDistance(
            Number(address.latitude),
            Number(address.longitude),
            Number(restaurant.address.latitude),
            Number(restaurant.address.longitude)
        );

        // 3. Calculate shipping fee (example logic)
        const shippingFee = distance <= 2 ? 15000 : 15000 + Math.ceil(distance - 2) * 5000;

        // 4. Calculate food total
        let foodTotal = 0;
        for (const item of data.items) {
            const food = await this.foodRepository.findOne({ where: { id: item.foodId } });
            if (!food) continue;
            foodTotal += Number(food.price) * item.quantity;
        }

        // 5. Return calculation
        return {
            foodTotal,
            shippingFee,
            distance: Number(distance.toFixed(2)),
            total: foodTotal + shippingFee,
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
}