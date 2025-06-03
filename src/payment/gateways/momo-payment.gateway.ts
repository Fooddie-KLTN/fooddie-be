import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
	IPaymentGateway,
	PaymentGatewayConfig,
	PaymentIntent,
	PaymentResult,
	PaymentStatus
} from '../interfaces/payment-gateway.interface';

/**
 * Momo Payment Gateway Implementation
 * 
 * This class implements the IPaymentGateway interface for the Momo payment service.
 * It handles payment creation, confirmation, cancellation, and status checking.
 */
@Injectable()
export class MomoPaymentGateway implements IPaymentGateway {
	private readonly logger = new Logger(MomoPaymentGateway.name);
	private config: PaymentGatewayConfig;
	private baseUrl: string;
	private momoConfig: {
		accessKey: string;
		secretKey: string;
		partnerCode: string;
		redirectUrl: string;
		ipnUrl: string;
		requestType: string;
		lang: string;
	};

	constructor(private readonly configService: ConfigService) { }

	/**
	 * Initialize the Momo payment gateway with configuration
	 * @param config Payment gateway configuration
	 */
	initialize(config: PaymentGatewayConfig): void {
		this.config = config;

		// Load Momo configuration from environment variables with defaults
		this.momoConfig = {
			accessKey: this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85',
			secretKey: this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
			partnerCode: this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO',
			redirectUrl: this.configService.get<string>('MOMO_REDIRECT_URL') || 'http://localhost:5000/views/home.html',
			ipnUrl: this.configService.get<string>('MOMO_IPN_URL') || 'https://0778-14-178-58-205.ngrok-free.app/callback',
			requestType: this.configService.get<string>('MOMO_REQUEST_TYPE') || 'payWithMethod',
			lang: this.configService.get<string>('MOMO_LANG') || 'vi',
		};

		// Set base URL from environment or use default
		this.baseUrl = this.configService.get<string>('MOMO_BASE_URL') ||
			'https://test-payment.momo.vn/v2/gateway/api';

		this.logger.log(`Momo payment gateway initialized in ${config.environment} mode`);
	}

	/**
	 * Create a payment intent with Momo
	 * @param orderId Order ID
	 * @param amount Amount to charge
	 * @param currency Currency code (VND)
	 * @param metadata Additional metadata
	 * @returns Payment intent
	 */
	async createPaymentIntent(
		orderId: string,
		amount: number,
		currency: string,
		metadata?: Record<string, any>
	): Promise<PaymentIntent> {
		try {
			// Extract configuration values
			const {
				accessKey,
				secretKey,
				partnerCode,
				redirectUrl,
				ipnUrl,
				requestType,
				lang,
			} = this.momoConfig;

			// Set default values for optional parameters
			const orderInfo = metadata?.orderInfo || 'pay with MoMo';
			const extraData = metadata?.extraData || '';
			const orderGroupId = metadata?.orderGroupId || '';
			const autoCapture = true;

			// Set request ID to order ID
			const requestId = orderId;

			// Create signature for the request
			const rawSignature = this.createSignature({
				accessKey,
				amount,
				extraData,
				ipnUrl,
				orderId,
				orderInfo,
				partnerCode,
				redirectUrl,
				requestId,
				requestType,
			});

			// Generate HMAC signature
			const signature = this.generateHmacSignature(rawSignature, secretKey);

			// Prepare request body
			const requestBody = JSON.stringify({
				partnerCode,
				partnerName: 'Test',
				storeId: 'MomoTestStore',
				requestId,
				amount,
				orderId,
				orderInfo,
				redirectUrl,
				ipnUrl,
				lang,
				requestType,
				autoCapture,
				extraData,
				orderGroupId,
				signature,
			});

			this.logger.debug(`Sending request to Momo: ${requestBody}`);

			// Configure axios request options
			const options = {
				method: 'POST',
				url: `${this.baseUrl}/create`,
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(requestBody),
				},
				data: requestBody,
			};

			// Send request to Momo
			const response = await axios(options);
			this.logger.debug(`Momo response: ${JSON.stringify(response.data)}`);

			const { payUrl, orderId: momoOrderId, requestId: momoRequestId } = response.data;

			// Return payment intent
			return {
				id: momoOrderId,
				amount,
				currency,
				status: PaymentStatus.PENDING,
				clientSecret: payUrl,
				metadata: {
					...metadata,
					momoRequestId,
					payUrl
				}
			};
		} catch (error) {
			this.logger.error(`Failed to create payment intent: ${error.message}`);
			if (error.response) {
				this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
			}
			throw error;
		}
	}

	/**
	 * Confirm a payment intent
	 * @param paymentIntentId Payment intent ID
	 * @returns Payment result
	 */
	async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
		try {
			// For Momo, we don't need to confirm the payment intent
			// The payment is confirmed via webhook
			return {
				success: true,
				paymentIntentId
			};
		} catch (error) {
			this.logger.error(`Failed to confirm payment intent: ${error.message}`);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Cancel a payment intent
	 * @param paymentIntentId Payment intent ID
	 * @returns Payment result
	 */
	async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
		try {
			// Momo doesn't support canceling payment intents directly
			// We can only check the status
			const status = await this.checkTransactionStatus(paymentIntentId);

			if (status === PaymentStatus.PENDING) {
				return {
					success: true,
					paymentIntentId
				};
			} else {
				return {
					success: false,
					error: 'Payment is already processed'
				};
			}
		} catch (error) {
			this.logger.error(`Failed to cancel payment intent: ${error.message}`);
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Refund a payment
	 * @param paymentIntentId Payment intent ID
	 * @param amount Amount to refund
	 * @returns Payment result
	 */
	async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
		// Momo doesn't support refunds in this implementation
		return {
			success: false,
			error: 'Refunds are not supported by this payment gateway'
		};
	}

	/**
	 * Get a payment intent
	 * @param paymentIntentId Payment intent ID
	 * @returns Payment intent
	 */
	async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
		try {
			const status = await this.checkTransactionStatus(paymentIntentId);

			return {
				id: paymentIntentId,
				amount: 0, // We don't have this information here
				currency: 'VND',
				status,
				metadata: {
					orderId: paymentIntentId
				}
			};
		} catch (error) {
			this.logger.error(`Failed to get payment intent: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Verify webhook signature
	 * @param payload Webhook payload
	 * @param signature Webhook signature
	 * @returns Whether the signature is valid
	 */
	verifyWebhookSignature(payload: any, signature: string): boolean {
		try {
			// For Momo, we need to verify the signature from the webhook
			// The signature is created using the same method as the request
			const rawSignature =
				'accessKey=' + this.momoConfig.accessKey +
				'&orderId=' + payload.orderId +
				'&partnerCode=' + payload.partnerCode +
				'&requestId=' + payload.requestId;

			const expectedSignature = this.generateHmacSignature(rawSignature, this.momoConfig.secretKey);

			return expectedSignature === signature;
		} catch (error) {
			this.logger.error(`Failed to verify webhook signature: ${error.message}`);
			return false;
		}
	}

	/**
	 * Handle webhook event
	 * @param payload Webhook payload
	 */
	async handleWebhookEvent(payload: any): Promise<void> {
		// Momo webhook handling is done in the PaymentService
		// This method is just a placeholder
	}

	/**
	 * Check transaction status
	 * @param orderId Order ID
	 * @returns Payment status
	 */
	private async checkTransactionStatus(orderId: string): Promise<PaymentStatus> {
		try {
			const { accessKey, secretKey, partnerCode, lang } = this.momoConfig;
			const requestId = orderId;

			// Create signature for the request
			const rawSignature =
				'accessKey=' + accessKey +
				'&orderId=' + orderId +
				'&partnerCode=' + partnerCode +
				'&requestId=' + requestId;

			const signature = this.generateHmacSignature(rawSignature, secretKey);

			// Prepare request body
			const requestBody = {
				partnerCode,
				requestId,
				orderId,
				signature,
				lang
			};

			// Send request to Momo
			const response = await axios.post(
				`${this.baseUrl}/query`,
				requestBody,
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			const { resultCode } = response.data;

			// Map Momo result codes to PaymentStatus
			if (resultCode === 0 || resultCode === 9000) {
				return PaymentStatus.SUCCEEDED;
			} else {
				return PaymentStatus.FAILED;
			}
		} catch (error) {
			this.logger.error(`Failed to check transaction status: ${error.message}`);
			return PaymentStatus.FAILED;
		}
	}

	/**
	 * Create signature string for Momo API
	 * @param params Parameters to include in signature
	 * @returns Signature string
	 */
	private createSignature(params: {
		accessKey: string;
		amount: number;
		extraData: string;
		ipnUrl: string;
		orderId: string;
		orderInfo: string;
		partnerCode: string;
		redirectUrl: string;
		requestId: string;
		requestType: string;
	}): string {
		const {
			accessKey,
			amount,
			extraData,
			ipnUrl,
			orderId,
			orderInfo,
			partnerCode,
			redirectUrl,
			requestId,
			requestType,
		} = params;

		return (
			'accessKey=' +
			accessKey +
			'&amount=' +
			amount +
			'&extraData=' +
			extraData +
			'&ipnUrl=' +
			ipnUrl +
			'&orderId=' +
			orderId +
			'&orderInfo=' +
			orderInfo +
			'&partnerCode=' +
			partnerCode +
			'&redirectUrl=' +
			redirectUrl +
			'&requestId=' +
			requestId +
			'&requestType=' +
			requestType
		);
	}

	/**
	 * Generate HMAC signature
	 * @param rawSignature Raw signature string
	 * @param secretKey Secret key
	 * @returns HMAC signature
	 */
	private generateHmacSignature(rawSignature: string, secretKey: string): string {
		return crypto
			.createHmac('sha256', secretKey)
			.update(rawSignature)
			.digest('hex');
	}
} 