import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

@Injectable()
export class OrderService {
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
        private dataSource: DataSource
    ) { }

    async createOrder(data: CreateOrderDto) {
        // Validate order details
        if (!data.orderDetails || data.orderDetails.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        // Use a transaction to ensure data consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find related entities
            const user = await queryRunner.manager.findOne(User, { where: { id: data.userId } });
            if (!user) throw new NotFoundException('User not found');

            const restaurant = await queryRunner.manager.findOne(Restaurant, { where: { id: data.restaurantId } });
            if (!restaurant) throw new NotFoundException('Restaurant not found');

            let address: Address | null = null;
            if (data.addressId) {
                address = await queryRunner.manager.findOne(Address, { where: { id: data.addressId } });
                if (!address) throw new NotFoundException('Address not found');
            }

            let promotion: Promotion | null = null;
            // Fix the property name mismatch (promotionId vs promotionCodeId)
            if (data.promotionId) {
                promotion = await queryRunner.manager.findOne(Promotion, { where: { id: data.promotionId } });
                if (!promotion) throw new NotFoundException('Promotion not found');
            }

            // Create order

            const order = new Order();
            order.user = user;
            order.restaurant = restaurant;
            order.total = data.total || 0;
            order.note = data.note || '';

            if (!address) {
                throw new BadRequestException('Address is required for an order');
            }
            order.address = address;

            if (!promotion) {
                throw new BadRequestException('Promotion is required for an order');
            }
            order.promotionCode = promotion ?? undefined;

            order.date = new Date().toISOString();
            order.status = 'pending';

            const savedOrder = await queryRunner.manager.save(Order, order);

            // Create order details
            // Create order details
            for (const detailData of data.orderDetails) {
                const food = await queryRunner.manager.findOne(Food, { where: { id: detailData.foodId } });
                if (!food) throw new NotFoundException(`Food with ID ${detailData.foodId} not found`);

                const orderDetail = new OrderDetail();
                orderDetail.order = savedOrder;
                orderDetail.food = food;
                orderDetail.quantity = detailData.quantity;
                orderDetail.price = detailData.price;
                orderDetail.note = detailData.note || '';

                await queryRunner.manager.save(OrderDetail, orderDetail);
            }

            await queryRunner.commitTransaction();

            // Return the complete order with details
            return await this.getOrderById(savedOrder.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
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
            relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.food', 'shippingDetail', 'promotionCode', 'address']
        });

        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async getOrdersByUser(userId: string) {
        return await this.orderRepository.find({
            where: { user: { id: userId } },
            relations: ['user', 'restaurant', 'orderDetails', 'orderDetails.food', 'promotionCode', 'address']
        });
    }

    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);

        // Validate status
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Invalid status. Valid values are: ${validStatuses.join(', ')}`);
        }

        order.status = status;
        return await this.orderRepository.save(order);
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
}