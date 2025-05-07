import { Controller, Post, Body, Param, Get, UseGuards, Req, BadRequestException, Redirect, Query, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../auth/auth.guard';
import { CheckoutStatus } from '../entities/checkout.entity';
import { ConfigService } from '@nestjs/config';
import { VnpayPaymentGateway } from './gateways/vnpay-payment.gateway';

@Controller('payment')
export class PaymentController {
	constructor(private readonly paymentService: PaymentService,
				private readonly vnpayPaymentGateway: VnpayPaymentGateway,
				private readonly configService: ConfigService,
	) { }

	@Post('checkout/:orderId')
	@UseGuards(AuthGuard)
	async createCheckout(
		@Param('orderId') orderId: string,
		@Body('paymentMethod') paymentMethod: string,
	) {
		return this.paymentService.createCheckout(orderId, paymentMethod);
	}

	@Post('process/:checkoutId')
	@UseGuards(AuthGuard)
	async processPayment(
		@Param('checkoutId') checkoutId: string,
		@Body() paymentDetails: Record<string, any>,
	) {
		return this.paymentService.processPayment(checkoutId, paymentDetails);
	}

	@Post('cancel/:checkoutId')
	@UseGuards(AuthGuard)
	async cancelCheckout(@Param('checkoutId') checkoutId: string) {
		return this.paymentService.cancelCheckout(checkoutId);
	}

	@Post('webhook')
	async handleWebhook(
		@Body() payload: any,
		@Req() req: any,
	) {
		// Get the signature from the request headers
		const signature = req.headers['x-payment-signature'];

		if (!signature) {
			throw new BadRequestException('Missing payment signature');
		}

		return this.paymentService.handleWebhookEvent(payload, signature);
	}

	@Get('checkout/:checkoutId')
	@UseGuards(AuthGuard)
	async getCheckoutStatus(@Param('checkoutId') checkoutId: string) {
		// This would typically be implemented in the service
		// For now, we'll just return a placeholder
		return {
			checkoutId,
			status: CheckoutStatus.PENDING,
		};
	}

	@Get('momo/result')
	async handleMomoResult(
		@Req() req: any,
	) {
		// Handle the redirect from Momo after payment
		const { orderId, resultCode, message } = req.query;

		if (!orderId) {
			throw new BadRequestException('Missing order ID');
		}

		// Process the result
		const result = await this.paymentService.handleMomoResult(orderId, resultCode, message);

		// Redirect to the frontend with the result
		return {
			success: resultCode === '0' || resultCode === '9000',
			orderId,
			message
		};
	}

	@Post('momo/check-status')
	async checkMomoStatus(
		@Body('orderId') orderId: string,
	) {
		if (!orderId) {
			throw new BadRequestException('Missing order ID');
		}

		return this.paymentService.checkMomoStatus(orderId);
	}

	/**
	 * Handle VNPAY payment result (return URL)
	 * @param query Query parameters from VNPAY return URL
	 * @returns Payment result with redirection
	 */
	@Get('vnpay/result')
	@Redirect()
	async handleVnpayResult(@Query() query: Record<string, string>) {
		try {
			// Set the VNPAY payment gateway
			this.paymentService.setPaymentGateway(this.vnpayPaymentGateway);
			
			// Process the return URL parameters
			const result = this.vnpayPaymentGateway.processReturnUrl(query);
			if (!result.paymentIntentId) {
				throw new BadRequestException('Invalid VNPAY result');
			}
			
			// Update order status based on payment result
			if (result.success) {
				await this.paymentService.handlePaymentSuccess(result.paymentIntentId);
				return {
					url: `${this.configService.get<string>('FRONTEND_URL')}/payment-success?orderId=${result.paymentIntentId}`,
				};
			} else {
				await this.paymentService.handlePaymentFailure(result.paymentIntentId);
				const errorMessage = encodeURIComponent(result.error || 'Payment failed');
				return {
					url: `${this.configService.get<string>('FRONTEND_URL')}/payment-failed?orderId=${result.paymentIntentId}&message=${errorMessage}`,
				};
			}
		} catch (error) {
			error(`VNPAY result error: ${error.message}`);
			return {
				url: `${this.configService.get<string>('FRONTEND_URL')}/payment-failed?message=${encodeURIComponent('An error occurred during payment processing')}`,
			};
		}
	}

	/**
	 * Handle VNPAY IPN (Instant Payment Notification)
	 * @param query Query parameters from VNPAY IPN
	 * @returns IPN processing result
	 */
	@Get('webhook/vnpay')
	async handleVnpayIpn(@Query() query: Record<string, string>) {
		try {
			// Set the VNPAY payment gateway
			this.paymentService.setPaymentGateway(this.vnpayPaymentGateway);
			
			// Process the IPN notification
			return this.vnpayPaymentGateway.processIpnNotification(query);
		} catch (error) {
			error(`VNPAY IPN error: ${error.message}`);
			return { RspCode: '99', Message: 'Internal server error' };
		}
	}

	/**
	 * Check VNPAY payment status
	 * @param orderId Order ID to check
	 * @returns Payment status information
	 */
	@Get('vnpay/status')
	@UseGuards(AuthGuard)
	async checkVnpayStatus(@Query('orderId') orderId: string) {
		if (!orderId) {
			throw new BadRequestException('Order ID is required');
		}
		
		return this.paymentService.checkPaymentStatus(orderId, 'vnpay');
	}
}