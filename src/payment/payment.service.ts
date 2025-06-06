import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderDetail } from '../entities/orderDetail.entity';
import { Checkout } from '../entities/checkout.entity';
import { CheckoutStatus } from '../entities/checkout.entity';
import { IPaymentGateway, PaymentGatewayConfig, PaymentResult } from './interfaces/payment-gateway.interface';
import { MomoPaymentGateway } from './gateways/momo-payment.gateway';
import { OrderService } from 'src/modules/order/order.service';
import { VnpayPaymentGateway } from './gateways/vnpay-payment.gateway';
import { PaymentStatusResponse } from './interfaces/payment-status.interface';
import { User } from 'src/entities/user.entity';
import { Food } from 'src/entities/food.entity';
import { pubSub } from 'src/pubsub';
import { PromotionService } from 'src/modules/promotion/promotion.service';
import { Promotion } from 'src/entities/promotion.entity';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private paymentGateway: IPaymentGateway;

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderDetail)
        private orderDetailRepository: Repository<OrderDetail>,
        @InjectRepository(Checkout)
        private checkoutRepository: Repository<Checkout>,
        @InjectRepository(Food)
        private foodRepository: Repository<Food>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
        
        private configService: ConfigService,
        private momoPaymentGateway: MomoPaymentGateway,
        private orderService: OrderService,
        private vnpayPaymentGateway: VnpayPaymentGateway,
        private promotionService: PromotionService, // Add promotion service
    ) { }

    /**
     * Set the payment gateway implementation
     */
    setPaymentGateway(gateway: IPaymentGateway) {
        this.paymentGateway = gateway;

        // Initialize the gateway with configuration
        const config: PaymentGatewayConfig = {
            apiKey: this.configService.get<string>('PAYMENT_API_KEY') || '',
            secretKey: this.configService.get<string>('PAYMENT_SECRET_KEY') || '',
            environment: this.configService.get<'sandbox' | 'production'>('PAYMENT_ENVIRONMENT', 'sandbox'),
            webhookSecret: this.configService.get<string>('PAYMENT_WEBHOOK_SECRET'),
        };

        this.paymentGateway.initialize(config);
    }

    /**
     * Create a checkout session for an order, or auto-complete if order is free
     * @param orderId Order ID to create checkout for
     * @param paymentMethod Payment method (only used for paid orders)
     * @returns Checkout record (completed immediately for free orders)
     */
    async createCheckout(orderId: string, paymentMethod: string): Promise<Checkout> {
        // Get the order with details including promotion
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['orderDetails', 'user', 'orderDetails.food', 'promotionCode'],
        });

        if (!order) {
            throw new BadRequestException(`Order with ID ${orderId} not found`);
        }

        // Handle free orders (price = 0) differently
        if (order.total === 0) {
            this.logger.log(`Order ${orderId} has zero price - processing as free order`);
            const checkout = this.checkoutRepository.create({
                user: order.user,
                amount: 0,
                paymentMethod: 'free',
                status: CheckoutStatus.COMPLETED,
                orderId: orderId,
            });
            await this.checkoutRepository.save(checkout);

            // Update order status to completed
            order.status = 'completed';
            await this.orderRepository.save(order);

            // Update food purchase count
            await this.updateFoodPurchaseCount(orderId);

            this.logger.log(`Free order ${orderId} processed automatically without payment`);
            return checkout;
        }

        // Regular flow for paid orders
        const checkout = this.checkoutRepository.create({
            user: order.user,
            amount: order.total,
            paymentMethod,
            status: CheckoutStatus.PENDING,
            orderId: orderId,
        });

        await this.checkoutRepository.save(checkout);

        // Include promotion information in metadata
        const promotionMetadata = order.promotionCode ? {
            promotionId: order.promotionCode.id,
            promotionCode: order.promotionCode.code,
            promotionType: order.promotionCode.type,
        } : {};

        if (paymentMethod === 'momo') {
            this.setPaymentGateway(this.momoPaymentGateway);
        } else if (paymentMethod === 'vnpay') {
            this.setPaymentGateway(this.vnpayPaymentGateway);
        } else {
            throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
        }

        switch (paymentMethod) {
            case 'momo':
                try {
                    const paymentIntent = await this.paymentGateway.createPaymentIntent(
                        orderId,
                        order.total,
                        'VND', // Default currency for Momo
                        {
                            orderId,
                            checkoutId: checkout.id,
                            userId: order.user.id,
                            redirectUrl: `${this.configService.get<string>('API_URL')}/payment/momo/result`,
                            ipnUrl: `${this.configService.get<string>('API_URL')}/payment/webhook`,
                            ...promotionMetadata // Include promotion data
                        }
                    );

                    // Update checkout with payment intent ID
                    checkout.paymentIntentId = paymentIntent.id;
                    await this.checkoutRepository.save(checkout);

                    // For Momo, we need to return the payment URL
                    if (paymentMethod === 'momo' && paymentIntent.clientSecret) {
                        return {
                            ...checkout,
                            paymentUrl: paymentIntent.clientSecret,
                        };
                    }

                    return checkout;
                } catch (error) {
                    this.logger.error(`Failed to create payment intent: ${error.message}`);
                    checkout.status = CheckoutStatus.FAILED;
                    await this.checkoutRepository.save(checkout);
                    throw new BadRequestException(`Payment processing failed: ${error.message}`);
                }
                break;
            case 'vnpay':
                try {
                    const paymentIntent = await this.paymentGateway.createPaymentIntent(
                        orderId,
                        order.total,
                        'VND', // Default currency for VNPAY
                        {
                            orderId,
                            checkoutId: checkout.id,
                            userId: order.user.id,
                            redirectUrl: `${this.configService.get<string>('VNPAY_URL')}`,
                            ipnUrl: `${this.configService.get<string>('API_URL')}/payment/webhook`,
                            ...promotionMetadata // Include promotion data
                        }
                    );

                    // Update checkout with payment intent ID
                    checkout.paymentIntentId = paymentIntent.id;
                    await this.checkoutRepository.save(checkout);

                    // For VNPAY, we need to return the payment URL
                    if (paymentMethod === 'vnpay' && paymentIntent.clientSecret) {
                        return {
                            ...checkout,
                            paymentUrl: paymentIntent.clientSecret,
                        };
                    }

                    return checkout;
                } catch (error) {
                    this.logger.error(`Failed to create payment intent: ${error.message}`);
                    checkout.status = CheckoutStatus.FAILED;
                    await this.checkoutRepository.save(checkout);
                    throw new BadRequestException(`Payment processing failed: ${error.message}`);
                }
                break;
            default:
                throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
        }
    }

    /**
     * Process a payment for a checkout
     */
    async processPayment(checkoutId: string, paymentDetails: Record<string, any>): Promise<PaymentResult> {
        const checkout = await this.checkoutRepository.findOne({
            where: { id: checkoutId },
            relations: ['user', 'food'],
        });

        if (!checkout) {
            throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
        }

        if (checkout.status !== CheckoutStatus.PENDING) {
            throw new BadRequestException(`Checkout is not in pending status: ${checkout.status}`);
        }

        try {
            // Set the appropriate payment gateway based on the payment method
            if (checkout.paymentMethod === 'momo') {
                this.setPaymentGateway(this.momoPaymentGateway);
            } else if (checkout.paymentMethod === 'vnpay') {
                this.setPaymentGateway(this.vnpayPaymentGateway);
            } else {
                throw new BadRequestException(`Unsupported payment method: ${checkout.paymentMethod}`);
            }

            // Confirm the payment intent
            const result = await this.paymentGateway.confirmPaymentIntent(checkout.paymentIntentId);

            if (result.success) {
                // Update checkout status
                checkout.status = CheckoutStatus.COMPLETED;
                checkout.paymentDetails = paymentDetails;
                await this.checkoutRepository.save(checkout);

                // Update order status
                const order = await this.orderRepository.findOne({
                    where: { id: checkout.orderId },
                });

                if (order) {
                          // Update order status to pending if payment method is COD
                          await this.orderService.updateOrderStatus(order.id, 'pending');
                          
                          // THÊM PUBLISH EVENT KHI STATUS CHUYỂN THÀNH PENDING
                          const updatedOrder = await this.orderService.getOrderById(order.id);
                          await pubSub.publish('orderCreated', { 
                            orderCreated: updatedOrder 
                          });
                          this.logger.log(`Published orderCreated event for order ${order.id} with status pending`);
                    await this.orderRepository.save(order);
                }

                
                // Update food purchase count
                await this.updateFoodPurchaseCount(checkout.orderId);

                return result;
            } else {
                // Update checkout status to failed
                checkout.status = CheckoutStatus.FAILED;
                await this.checkoutRepository.save(checkout);
                return result;
            }
        } catch (error) {
            this.logger.error(`Payment processing failed: ${error.message}`);
            checkout.status = CheckoutStatus.FAILED;
            await this.checkoutRepository.save(checkout);
            throw new BadRequestException(`Payment processing failed: ${error.message}`);
        }
    }

    /**
     * Cancel a checkout
     */
    async cancelCheckout(checkoutId: string): Promise<Checkout> {
        const checkout = await this.checkoutRepository.findOne({ where: { id: checkoutId } });

        if (!checkout) {
            throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
        }

        if (checkout.status !== CheckoutStatus.PENDING) {
            throw new BadRequestException(`Checkout is not in pending status: ${checkout.status}`);
        }

        // Set the appropriate payment gateway based on the payment method
        if (checkout.paymentMethod === 'momo') {
            this.setPaymentGateway(this.momoPaymentGateway);
        } else {
            throw new BadRequestException(`Unsupported payment method: ${checkout.paymentMethod}`);
        }

        // Cancel the payment intent if it exists
        if (checkout.paymentIntentId) {
            try {
                await this.paymentGateway.cancelPaymentIntent(checkout.paymentIntentId);
            } catch (error) {
                this.logger.error(`Failed to cancel payment intent: ${error.message}`);
            }
        }

        // Update checkout status
        checkout.status = CheckoutStatus.CANCELLED;
        await this.checkoutRepository.save(checkout);

        // Update order status
        const order = await this.orderRepository.findOne({ where: { id: checkout.orderId } });
        if (order) {
            order.status = 'canceled';
            await this.orderRepository.save(order);
        }
        return checkout;
    }

    /**
     * Handle webhook events from the payment gateway
     */
    async handleWebhookEvent(payload: any, signature: string): Promise<void> {
        // Set the appropriate payment gateway based on the payload
        if (payload.partnerCode === 'MOMO') {
            this.setPaymentGateway(this.momoPaymentGateway);
        } else {
            throw new BadRequestException(`Unsupported payment gateway: ${payload.partnerCode}`);
        }

        // Verify the webhook signature
        if (!this.paymentGateway.verifyWebhookSignature(payload, signature)) {
            throw new BadRequestException('Invalid webhook signature');
        }

        // Process the webhook event
        await this.paymentGateway.handleWebhookEvent(payload);

        // Handle specific events
        const eventType = payload.type || 'payment_intent.succeeded';

        if (eventType === 'payment_intent.succeeded' || payload.resultCode === '0' || payload.resultCode === '9000') {
            const paymentIntentId = payload.orderId;
            await this.handlePaymentSuccess(paymentIntentId);
        } else if (eventType === 'payment_intent.payment_failed' || payload.resultCode !== '0') {
            const paymentIntentId = payload.orderId;
            await this.handlePaymentFailure(paymentIntentId);
        }
    }

    /**
     * Handle successful payment
     */
    public async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
        // Find the checkout with this payment intent ID
        const checkout = await this.checkoutRepository.findOne({
            where: { paymentIntentId },
            relations: ['order', 'order.promotionCode']
        });

        if (checkout) {
            // Update checkout status
            checkout.status = CheckoutStatus.COMPLETED;
            await this.checkoutRepository.save(checkout);

            // Update order status
            const order = await this.orderRepository.findOne({
                where: { id: checkout.orderId },
                relations: ['promotionCode']
            });
            
            if (order) {
                order.status = 'completed';
                order.isPaid = true;
                order.paymentDate = new Date().toISOString();
                await this.orderRepository.save(order);
                
                // Ensure promotion usage is recorded (in case it wasn't during order creation)
                if (order.promotionCode) {
                    try {
                        await this.promotionService.usePromotion(order.promotionCode.code, order.total);
                        this.logger.log(`Promotion ${order.promotionCode.code} usage recorded for order ${order.id}`);
                    } catch (error) {
                        this.logger.error(`Failed to record promotion usage: ${error.message}`);
                    }
                }
                
                // Notify order service
                this.orderService.confirmPayment(checkout.orderId);
            }

            // Update food purchase count
            await this.updateFoodPurchaseCount(checkout.orderId);
        }
    }

    /**
     * Handle failed payment
     */
    public async handlePaymentFailure(paymentIntentId: string): Promise<void> {
        // Find the checkout with this payment intent ID
        const checkout = await this.checkoutRepository.findOne({
            where: { paymentIntentId },
        });

        if (checkout) {
            // Update checkout status
            checkout.status = CheckoutStatus.FAILED;
            await this.checkoutRepository.save(checkout);

            // Update order status
            const order = await this.orderRepository.findOne({
                where: { id: checkout.orderId },
            });
            if (order) {
                order.status = 'canceled'; // or 'failed'
                await this.orderRepository.save(order);
            }
        }
    }

    /**
     * Handle Momo payment result
     */
    async handleMomoResult(orderId: string, resultCode: string, message: string): Promise<any> {
        // Set the Momo payment gateway
        this.setPaymentGateway(this.momoPaymentGateway);

        // Find the checkout with this order ID
        const checkout = await this.checkoutRepository.findOne({
            where: { orderId },
        });

        if (!checkout) {
            throw new BadRequestException(`Checkout with order ID ${orderId} not found`);
        }

        // Process the result
        if (resultCode === '0' || resultCode === '9000') {
            await this.handlePaymentSuccess(checkout.paymentIntentId);
            return {
                success: true,
                message: 'Payment successful',
            };
        } else {
            await this.handlePaymentFailure(checkout.paymentIntentId);
            return {
                success: false,
                message: message || 'Payment failed',
            };
        }
    }

    /**
     * Check Momo payment status
     */
    async checkMomoStatus(orderId: string): Promise<any> {
        // Set the Momo payment gateway
        this.setPaymentGateway(this.momoPaymentGateway);

        // Find the checkout with this order ID
        const checkout = await this.checkoutRepository.findOne({
            where: { orderId },
        });

        if (!checkout) {
            throw new BadRequestException(`Checkout with order ID ${orderId} not found`);
        }

        // Get the payment intent
        const paymentIntent = await this.paymentGateway.getPaymentIntent(checkout.paymentIntentId);

        return {
            orderId,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        };
    }

    /**
     * Check payment status for an order
     * @param orderId Order ID
     * @param paymentMethod Payment method (optional)
     * @returns Payment status information
     */
    async checkPaymentStatus(orderId: string, paymentMethod?: string): Promise<PaymentStatusResponse> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) {
            throw new BadRequestException(`Order with ID ${orderId} not found`);
        }

        // Find the checkout for this order
        const checkout = await this.checkoutRepository.findOne({
            where: { orderId },
        });

        if (!checkout) {
            throw new BadRequestException(`Checkout for order ${orderId} not found`);
        }

        // Set payment gateway based on checkout or provided method
        const method = paymentMethod || checkout.paymentMethod;
        if (method === 'momo') {
            this.setPaymentGateway(this.momoPaymentGateway);
        } else if (method === 'vnpay') {
            this.setPaymentGateway(this.vnpayPaymentGateway);
        } else {
            throw new BadRequestException(`Unsupported payment method: ${method}`);
        }

        // Create base response
        const response: PaymentStatusResponse = {
            orderId,
            status: order.status,
            amount: order.total,
            currency: 'VND',
            checkoutId: checkout.id,
            checkoutStatus: checkout.status,
            paymentMethod: method,
        };

        // Fetch additional payment intent details if available
        if (checkout.paymentIntentId) {
            try {
                const paymentIntent = await this.paymentGateway.getPaymentIntent(checkout.paymentIntentId);
                response.paymentIntentStatus = paymentIntent.status;
                response.metadata = paymentIntent.metadata;
            } catch (error) {
                this.logger.error(`Failed to get payment intent for ${checkout.paymentIntentId}: ${error.message}`);
            }
        }

        return response;
    }

    /**
     * Update purchase count for food items in an order
     * @param orderId Order ID for completed payment
     */
    private async updateFoodPurchaseCount(orderId: string): Promise<void> {
        try {
            // Find the order with details and related foods
            const order = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: ['orderDetails', 'orderDetails.food'],
            });

            if (!order) {
                this.logger.warn(`Cannot update food purchase count: Order ${orderId} not found`);
                return;
            }

            // Update purchase count for each food item
            for (const detail of order.orderDetails) {
                if (detail.food) {
                    // Parse quantity and increment the purchasedNumber
                    const quantity = (detail.quantity) || 1;
                    
                    // Update food purchase count
                    detail.food.purchasedNumber = (detail.food.purchasedNumber || 0) + quantity;
                    detail.food.soldCount = (detail.food.soldCount || 0) + quantity;
                    
                    await this.foodRepository.save(detail.food);
                    
                    this.logger.log(`Updated purchase count for food ${detail.food.id}, new count: ${detail.food.purchasedNumber}`);
                }
            }

            this.logger.log(`Food purchase counts updated for order ${orderId}`);
        } catch (error) {
            this.logger.error(`Failed to update food purchase count: ${error.message}`, error.stack);
        }
    }
}