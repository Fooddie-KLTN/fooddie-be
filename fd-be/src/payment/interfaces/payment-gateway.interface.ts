export interface PaymentGatewayConfig {
	apiKey: string;
	secretKey: string;
	environment: 'sandbox' | 'production';
	webhookSecret?: string;
}

export interface PaymentMethod {
	id: string;
	type: string;
	details: Record<string, any>;
}

export interface PaymentIntent {
	id: string;
	amount: number;
	currency: string;
	status: PaymentStatus;
	paymentMethod?: PaymentMethod;
	clientSecret?: string;
	metadata?: Record<string, any>;
}

export enum PaymentStatus {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	SUCCEEDED = 'SUCCEEDED',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED',
}

export interface PaymentResult {
	success: boolean;
	paymentIntentId?: string;
	error?: string;
	redirectUrl?: string;
	metadata?: Record<string, any>;
}

export interface IPaymentGateway {
	/**
	 * Initialize the payment gateway with configuration
	 */
	initialize(config: PaymentGatewayConfig): void;

	/**
	 * Create a payment intent for an order
	 */
	createPaymentIntent(
		orderId: string,
		amount: number,
		currency: string,
		metadata?: Record<string, any>
	): Promise<PaymentIntent>;

	/**
	 * Confirm a payment intent
	 */
	confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult>;

	/**
	 * Cancel a payment intent
	 */
	cancelPaymentIntent(paymentIntentId: string): Promise<PaymentResult>;

	/**
	 * Refund a payment
	 */
	refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult>;

	/**
	 * Get payment intent details
	 */
	getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

	/**
	 * Verify webhook signature
	 */
	verifyWebhookSignature(payload: any, signature: string): boolean;

	/**
	 * Handle webhook events
	 */
	handleWebhookEvent(payload: any): Promise<void>;
} 