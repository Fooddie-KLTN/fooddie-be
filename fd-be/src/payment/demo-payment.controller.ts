import { Controller, Post, Body, Get, Query, Redirect, BadRequestException, Logger } from '@nestjs/common';
import { MomoPaymentGateway } from './gateways/momo-payment.gateway';
import { ConfigService } from '@nestjs/config';
import { VnpayPaymentGateway } from './gateways/vnpay-payment.gateway';

// Define interfaces for our dummy data
interface DummyOrder {
	id: string;
	totalAmount: number;
	status: string;
	createdAt: Date;
	[key: string]: any;
}

interface DummyCheckout {
	id: string;
	orderId: string;
	amount: number;
	status: string;
	createdAt: Date;
	paymentMethod: string;
	paymentIntentId?: string;
	paymentDetails?: Record<string, any>;
}

@Controller('demo-payment')
export class DemoPaymentController {
	private readonly dummyOrders = new Map<string, DummyOrder>();
	private readonly dummyCheckouts = new Map<string, DummyCheckout>();
	private readonly logger = new Logger(DemoPaymentController.name);

	constructor(
		private readonly momoPaymentGateway: MomoPaymentGateway,
		private readonly vnpayPaymentGateway: VnpayPaymentGateway,
		private readonly configService: ConfigService,
	) {
		// Initialize the Momo payment gateway with the correct configuration
		this.momoPaymentGateway.initialize({
			apiKey: 'F8BBA842ECF85', // Using the example API key
			secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz', // Using the example secret key
			environment: 'sandbox',
			webhookSecret: 'K951B6PE1waDMi640xX08PD3vg6EkVlz', // Using the same secret key for webhook
		});
	}

	/**
	 * Create a dummy order for demo purposes
	 */
	@Post('create-order')
	async createDummyOrder(@Body() orderData: any) {
		const orderId = `MOMO${Date.now()}`; // Using the format from the example
		const order: DummyOrder = {
			id: orderId,
			totalAmount: orderData.amount || 10000, // Using 10000 as default amount
			status: 'pending',
			createdAt: new Date(),
			...orderData,
		};

		this.dummyOrders.set(orderId, order);

		return {
			success: true,
			message: 'Dummy order created successfully',
			orderId,
			order,
		};
	}

	// Update the createCheckout method to properly handle VNPAY payment method

	/**
	 * Create a checkout session for a dummy order
	 */
	@Post('create-checkout')
	async createCheckout(@Body() checkoutData: any) {
		const { orderId, paymentMethod = 'momo', bankCode } = checkoutData;

		if (!orderId) {
			throw new BadRequestException('Order ID is required');
		}

		const order = this.dummyOrders.get(orderId);
		if (!order) {
			throw new BadRequestException(`Order with ID ${orderId} not found`);
		}

		const checkoutId = `checkout-${Date.now()}`;
		const checkout: DummyCheckout = {
			id: checkoutId,
			orderId,
			amount: order.totalAmount,
			status: 'pending',
			createdAt: new Date(),
			paymentMethod,
		};

		this.dummyCheckouts.set(checkoutId, checkout);

		// Get client IP address
		const ipAddr = checkoutData.ipAddress || '127.0.0.1';

		// Base URLs for callbacks
		const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';

		try {
			let paymentIntent;

			if (paymentMethod === 'vnpay') {
				// Create VNPAY payment intent
				paymentIntent = await this.vnpayPaymentGateway.createPaymentIntent(
					orderId,
					order.totalAmount,
					'VND',
					{
						orderInfo: `Thanh toan don hang ${orderId}`,
						orderType: 'billpayment',
						ipAddress: ipAddr,
						redirectUrl: `${baseUrl}/demo-payment/vnpay-result`,
						bankCode: bankCode || '',
						// Added optional parameters
						expireMinutes: 15 // 15 minutes expiration
					}
				);
			} else {
				// Default to Momo payment
				paymentIntent = await this.momoPaymentGateway.createPaymentIntent(
					orderId,
					order.totalAmount,
					'VND',
					{
						orderId,
						checkoutId,
						orderInfo: 'pay with MoMo',
						redirectUrl: `${baseUrl}/demo-payment/result`,
						ipnUrl: `${baseUrl}/demo-payment/webhook`,
						extraData: '',
						orderGroupId: '',
					}
				);
			}

			// Update checkout with payment intent ID
			checkout.paymentIntentId = paymentIntent.id;
			this.dummyCheckouts.set(checkoutId, checkout);

			// Return checkout with payment URL
			return {
				success: true,
				message: 'Checkout created successfully',
				checkoutId,
				paymentUrl: paymentIntent.clientSecret,
				checkout,
			};
		} catch (error) {
			this.logger.error(`Failed to create payment intent: ${error.message}`);
			throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
		}
	}

	/**
	 * Handle VNPAY payment result (Return URL)
	 * This endpoint is called when the user is redirected back from VNPAY
	 */
	@Get('vnpay-result')
	@Redirect()
	async handleVnpayResult(@Query() query: Record<string, string>): Promise<{ url: string }> {
		try {
			// Get the transaction reference (order ID)
			const orderId = query.vnp_TxnRef;
			if (!orderId) {
				throw new BadRequestException('Order ID is required');
			}

			// Get the order
			const order = this.dummyOrders.get(orderId);
			if (!order) {
				throw new BadRequestException(`Order with ID ${orderId} not found`);
			}

			// Find the checkout for this order
			let checkoutId: string | undefined;
			for (const [id, checkout] of this.dummyCheckouts.entries()) {
				if (checkout.orderId === orderId) {
					checkoutId = id;
					break;
				}
			}

			if (!checkoutId) {
				throw new BadRequestException(`Checkout for order ${orderId} not found`);
			}

			const checkout = this.dummyCheckouts.get(checkoutId);
			if (!checkout) {
				throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
			}

			// Process the return URL parameters
			const result = this.vnpayPaymentGateway.processReturnUrl(query);

			 // Important: In production, don't trust the Return URL for business logic
			// Only update UI state here. The actual business logic should be in the IPN handler.
			
			// Just redirect to success or failure page
			if (result.success) {
				return {
					url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
				};
			} else {
				const errorMessage = encodeURIComponent(result.error || 'Payment failed');
				return {
					url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment-failed?orderId=${orderId}&message=${errorMessage}`,
				};
			}
		} catch (error) {
			this.logger.error(`VNPAY result processing error: ${error.message}`);
			return {
				url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment-failed?message=${encodeURIComponent('An error occurred during payment processing')}`,
			};
		}
	}

	/**
	 * Handle VNPAY IPN (Instant Payment Notification)
	 * This endpoint is called server-to-server by VNPAY to notify of payment status
	 * Must return specific JSON response format
	 */
	@Get('vnpay-ipn')
	async handleVnpayIpn(@Query() query: Record<string, string>): Promise<{ RspCode: string; Message: string }> {
		try {
			this.logger.log('Received VNPAY IPN notification', JSON.stringify(query));
			
			// Verify the signature - this is crucial for security
			const isValidSignature = this.vnpayPaymentGateway.verifyWebhookSignature(
				query,
				query.vnp_SecureHash
			);
			
			if (!isValidSignature) {
				this.logger.warn('Invalid VNPAY signature', JSON.stringify(query));
				return { RspCode: '97', Message: 'Invalid signature' };
			}
			
			// Get transaction details
			const orderId = query.vnp_TxnRef;
			const amount = parseInt(query.vnp_Amount) / 100; // Convert back from smallest unit
			const responseCode = query.vnp_ResponseCode;
			const transactionStatus = query.vnp_TransactionStatus;
			
			// Find our order
			const order = this.dummyOrders.get(orderId);
			if (!order) {
				this.logger.warn(`Order with ID ${orderId} not found`);
				return { RspCode: '01', Message: 'Order not found' };
			}
			
			// Check amount - important security check!
			if (amount !== order.totalAmount) {
				this.logger.warn(`Amount mismatch: expected ${order.totalAmount}, received ${amount}`);
				return { RspCode: '04', Message: 'Invalid amount' };
			}
			
			// Find the checkout
			let checkoutId: string | undefined;
			for (const [id, checkout] of this.dummyCheckouts.entries()) {
				if (checkout.orderId === orderId) {
					checkoutId = id;
					break;
				}
			}
			
			if (!checkoutId) {
				this.logger.warn(`Checkout for order ${orderId} not found`);
				return { RspCode: '01', Message: 'Checkout not found' };
			}
			
			const checkout = this.dummyCheckouts.get(checkoutId);
			if (!checkout) {
				this.logger.warn(`Checkout with ID ${checkoutId} not found`);
				return { RspCode: '01', Message: 'Checkout not found' };
			}
			// Process the payment based on the response
			if (responseCode === '00' && transactionStatus === '00') {
				// Payment successful - update order and checkout status
				order.status = 'completed';
				checkout.status = 'completed';
				
				// Store transaction details for reference
				checkout.paymentDetails = {
					vnp_TransactionNo: query.vnp_TransactionNo,
					vnp_BankCode: query.vnp_BankCode,
					vnp_BankTranNo: query.vnp_BankTranNo,
					vnp_CardType: query.vnp_CardType,
					vnp_PayDate: query.vnp_PayDate,
				};
				
				this.dummyOrders.set(orderId, order);
				this.dummyCheckouts.set(checkoutId, checkout);
				
				this.logger.log(`Payment successful for order ${orderId}`);
				
				// Here you would typically:
				// 1. Grant access to purchased products/services
				// 2. Send confirmation emails
				// 3. Update inventory if needed
				
				return { RspCode: '00', Message: 'Confirm success' };
			} else {
				// Payment failed
				order.status = 'failed';
				checkout.status = 'failed';
				this.dummyOrders.set(orderId, order);
				this.dummyCheckouts.set(checkoutId, checkout);
				
				this.logger.warn(`Payment failed for order ${orderId}: ${responseCode}`);
				
				return { RspCode: '00', Message: 'Confirm success' };
			}
		} catch (error) {
			this.logger.error(`Error processing VNPAY IPN: ${error.message}`);
			return { RspCode: '99', Message: 'Unknown error' };
		}
	}

	/**
	 * Handle Momo payment result
	 */
	@Get('result')
	@Redirect()
	async handleMomoResult(
		@Query('orderId') orderId: string,
		@Query('resultCode') resultCode: string,
		@Query('message') message: string,
	) {
		if (!orderId) {
			throw new BadRequestException('Order ID is required');
		}

		const order = this.dummyOrders.get(orderId);
		if (!order) {
			throw new BadRequestException(`Order with ID ${orderId} not found`);
		}

		// Find the checkout for this order
		let checkoutId: string | undefined;
		for (const [id, checkout] of this.dummyCheckouts.entries()) {
			if (checkout.orderId === orderId) {
				checkoutId = id;
				break;
			}
		}

		if (!checkoutId) {
			throw new BadRequestException(`Checkout for order ${orderId} not found`);
		}

		const checkout = this.dummyCheckouts.get(checkoutId);
		if (!checkout) {
			throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
		}

		// Process the result
		if (resultCode === '0' || resultCode === '9000') {
			// Payment successful
			order.status = 'completed';
			checkout.status = 'completed';
			this.dummyOrders.set(orderId, order);
			this.dummyCheckouts.set(checkoutId, checkout);

			return {
				url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment-success?orderId=${orderId}`,
			};
		} else {
			// Payment failed
			order.status = 'failed';
			checkout.status = 'failed';
			this.dummyOrders.set(orderId, order);
			this.dummyCheckouts.set(checkoutId, checkout);

			return {
				url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment-failed?orderId=${orderId}&message=${message}`,
			};
		}
	}

	/**
	 * Check payment status
	 */
	@Get('check-status')
	async checkPaymentStatus(@Query('orderId') orderId: string) {
		if (!orderId) {
			throw new BadRequestException('Order ID is required');
		}

		const order = this.dummyOrders.get(orderId);
		if (!order) {
			throw new BadRequestException(`Order with ID ${orderId} not found`);
		}

		// Find the checkout for this order
		let checkoutId: string | undefined;
		for (const [id, checkout] of this.dummyCheckouts.entries()) {
			if (checkout.orderId === orderId) {
				checkoutId = id;
				break;
			}
		}

		if (!checkoutId) {
			throw new BadRequestException(`Checkout for order ${orderId} not found`);
		}

		const checkout = this.dummyCheckouts.get(checkoutId);
		if (!checkout) {
			throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
		}

		return {
			orderId,
			status: order.status,
			amount: order.totalAmount,
			currency: 'VND',
			checkoutId,
			checkoutStatus: checkout.status,
		};
	}

	/**
	 * Handle Momo webhook
	 */
	@Post('webhook')
	async handleWebhook(@Body() payload: any) {
		// In a real implementation, you would verify the signature
		// For demo purposes, we'll just process the webhook

		const orderId = payload.orderId;
		if (!orderId) {
			throw new BadRequestException('Order ID is required in webhook payload');
		}

		const order = this.dummyOrders.get(orderId);
		if (!order) {
			throw new BadRequestException(`Order with ID ${orderId} not found`);
		}

		// Find the checkout for this order
		let checkoutId: string | undefined;
		for (const [id, checkout] of this.dummyCheckouts.entries()) {
			if (checkout.orderId === orderId) {
				checkoutId = id;
				break;
			}
		}

		if (!checkoutId) {
			throw new BadRequestException(`Checkout for order ${orderId} not found`);
		}

		const checkout = this.dummyCheckouts.get(checkoutId);
		if (!checkout) {
			throw new BadRequestException(`Checkout with ID ${checkoutId} not found`);
		}

		// Process the webhook
		if (payload.resultCode === '0' || payload.resultCode === '9000') {
			// Payment successful
			order.status = 'completed';
			checkout.status = 'completed';
			this.dummyOrders.set(orderId, order);
			this.dummyCheckouts.set(checkoutId, checkout);

			return {
				success: true,
				message: 'Webhook processed successfully',
			};
		} else {
			// Payment failed
			order.status = 'failed';
			checkout.status = 'failed';
			this.dummyOrders.set(orderId, order);
			this.dummyCheckouts.set(checkoutId, checkout);

			return {
				success: true,
				message: 'Webhook processed successfully',
			};
		}
	}

	/**
	 * Get all dummy orders
	 */
	@Get('orders')
	async getDummyOrders() {
		return Array.from(this.dummyOrders.values());
	}

	/**
	 * Get all dummy checkouts
	 */
	@Get('checkouts')
	async getDummyCheckouts() {
		return Array.from(this.dummyCheckouts.values());
	}
}