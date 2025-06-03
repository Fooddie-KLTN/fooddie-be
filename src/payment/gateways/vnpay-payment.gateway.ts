import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import * as qs from 'qs'; // Replace querystring with qs to match VNPAY exactly
import {
    IPaymentGateway,
    PaymentGatewayConfig,
    PaymentIntent,
    PaymentResult,
    PaymentStatus
} from '../interfaces/payment-gateway.interface';

/**
 * VNPAY Payment Gateway Implementation
 * 
 * This class implements the IPaymentGateway interface for the VNPAY payment service.
 * It handles payment creation, confirmation, cancellation, and status checking.
 */
@Injectable()
export class VnpayPaymentGateway implements IPaymentGateway {
    private readonly logger = new Logger(VnpayPaymentGateway.name);
    private config: PaymentGatewayConfig;
    private baseUrl: string;
    private apiUrl: string;
    private vnpayConfig: {
        tmnCode: string;
        secretKey: string;
        returnUrl: string;
        ipnUrl: string;
        version: string;
        locale: string;
        currencyCode: string;
    };

    constructor(private readonly configService: ConfigService) { }

    /**
     * Initialize the gateway when the module loads
     */
    onModuleInit(): void {
        this.initializeDefaults();
        this.logger.log('VNPAY payment gateway auto-initialized with default settings');
    }

    /**
     * Initialize default values from environment variables
     */
    private initializeDefaults(): void {
        // Set up default configuration from environment variables
        this.vnpayConfig = {
            tmnCode: this.configService.get<string>('VNPAY_TMN_CODE') || 'DEMO',
            secretKey: this.configService.get<string>('VNPAY_HASH_SECRET') || 'VNPAYSECRETKEY',
            returnUrl: this.configService.get<string>('VNPAY_RETURN_URL') || 'http://localhost:3000/payment/vnpay/result',
            ipnUrl: this.configService.get<string>('VNPAY_IPN_URL') || 'http://localhost:3000/payment/webhook/vnpay',
            version: this.configService.get<string>('VNPAY_VERSION') || '2.1.0',
            locale: this.configService.get<string>('VNPAY_LOCALE') || 'vn',
            currencyCode: this.configService.get<string>('VNPAY_CURRENCY') || 'VND',
        };

        // Set API URLs with proper defaults
        this.baseUrl = this.configService.get<string>('VNPAY_BASE_URL') ||
            'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

        this.apiUrl = this.configService.get<string>('VNPAY_API_URL') ||
            'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

        this.logger.log(`Loaded VNPAY configuration:
      - TMN Code: ${this.vnpayConfig.tmnCode}
      - Return URL: ${this.vnpayConfig.returnUrl}
      - IPN URL: ${this.vnpayConfig.ipnUrl}
      - Base URL: ${this.baseUrl}`);
    }

    /**
     * Initialize the VNPAY payment gateway with configuration
     * @param config Payment gateway configuration
     */
    initialize(config: PaymentGatewayConfig): void {
        this.config = config;

        // Initialize defaults if not already done
        if (!this.vnpayConfig) {
            this.initializeDefaults();
        }

        // Override defaults with provided configuration if needed
        if (config.apiKey) {
            this.vnpayConfig.tmnCode = config.apiKey;
        }

        if (config.secretKey) {
            this.vnpayConfig.secretKey = config.secretKey;
        }

        // Use environment specific URLs if provided
        if (config.environment === 'production') {
            this.baseUrl = 'https://pay.vnpay.vn/vpcpay.html';
            this.apiUrl = 'https://merchant.vnpay.vn/merchant_webapi/api/transaction';
        }

        this.logger.log(`VNPAY payment gateway initialized in ${config.environment} mode`);
    }

    /**
     * Creates a payment intent with VNPAY
     * @param orderId Order identifier
     * @param amount Payment amount
     * @param currency Currency code (default: VND)
     * @param metadata Additional parameters
     * @returns Payment intent with URL for redirection
     */
    async createPaymentIntent(
        orderId: string,
        amount: number,
        currency: string,
        metadata?: Record<string, any>
    ): Promise<PaymentIntent> {
        try {
            // Set timezone to match VNPAY's requirements
            process.env.TZ = 'Asia/Ho_Chi_Minh';

            const { tmnCode, secretKey, version, locale } = this.vnpayConfig;

            // Create date for VNPAY using current time
            const createDate = new Date();
            const createDateFormat = this.formatDateToVnpay(createDate);

            // Format order info from metadata or use default
            const orderInfo = metadata?.orderInfo || `Pay for order ${orderId}`;

            // Get return URL from metadata or use default
            const returnUrl = metadata?.redirectUrl || this.vnpayConfig.returnUrl;

            // Get IP address from metadata or use default
            const ipAddr = metadata?.ipAddress || '127.0.0.1';

            // Prepare params - use string values for all fields
            const vnpParams: Record<string, string> = {
                vnp_Version: version,
                vnp_Command: 'pay',
                vnp_TmnCode: tmnCode,
                vnp_Locale: locale,
                vnp_CurrCode: currency || 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: metadata?.orderType || 'other',
                vnp_Amount: Math.round(amount * 100).toString(), // Ensure exact integer
                vnp_ReturnUrl: returnUrl,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDateFormat
            };

            //vnpParams.vnp_WaitingPayment = '1'; // Try adding this parameter
        
            // Add optional bank code if provided
            // if (metadata?.bankCode) {
            //     vnpParams.vnp_BankCode = metadata.bankCode;
            // }

            // Calculate expire date (default 15 minutes) if needed
            if (metadata?.expireMinutes) {
                const expireMinutes = metadata.expireMinutes;
                const expireDate = new Date(createDate.getTime() + expireMinutes * 60000);
                vnpParams.vnp_ExpireDate = this.formatDateToVnpay(expireDate);
            }

            // Sort params exactly as VNPAY sample does
            const sortedParams = this.sortObject(vnpParams);

            // Create signature string using qs module to match VNPAY's sample exactly
            const signData = qs.stringify(sortedParams, { encode: false });

            this.logger.debug(`Raw signature input: ${signData}`);
            this.logger.debug(`Using secret key: ${secretKey}`);

            // Generate HMAC signature exactly as in VNPAY's sample
            const hmac = crypto.createHmac('sha512', secretKey);
            const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

            // Add signature to parameters
            sortedParams.vnp_SecureHash = secureHash;

            // Build the payment URL using the same approach as VNPAY's sample
            const paymentUrl = `${this.baseUrl}?${qs.stringify(sortedParams, { encode: false })}`;

            this.logger.debug(`Generated signature: ${secureHash}`);
            this.logger.debug(`Created VNPAY payment URL: ${paymentUrl}`);

            // Return the payment intent
            return {
                id: orderId,
                amount: amount,
                currency: currency,
                status: PaymentStatus.PENDING,
                clientSecret: paymentUrl,
                metadata: {
                    ...metadata,
                    vnp_TxnRef: orderId,
                    vnp_CreateDate: createDateFormat,
                    paymentUrl
                }
            };
        } catch (error) {
            this.logger.error(`Failed to create payment intent: ${error.message}`);
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
            // For VNPAY, confirmation happens via return URL
            // This method is mainly a placeholder as VNPAY doesn't have direct confirmation API
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
            // VNPAY doesn't support direct cancellation of pending payments
            // Payments will expire if not completed within the expiration window
            return {
                success: true,
                paymentIntentId
            };
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
        // VNPAY requires manual refund process through their merchant portal
        // This is a placeholder for future implementation if VNPAY provides an API
        return {
            success: false,
            error: 'Refunds must be processed manually through the VNPAY merchant portal'
        };
    }

    /**
     * Get payment intent details
     * @param paymentIntentId Payment intent ID
     * @returns Payment intent
     */
    async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
        try {
            // VNPAY doesn't have a direct API to check payment status in this implementation
            // You would need to use their transaction query API if available
            return {
                id: paymentIntentId,
                amount: 0,
                currency: 'VND',
                status: PaymentStatus.PENDING,
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
     * Process VNPAY return URL parameters
     * @param params Query parameters from VNPAY return URL
     * @returns Payment processing result
     */
    processReturnUrl(params: Record<string, string>): PaymentResult {
        try {
            // Log received parameters for debugging
            this.logger.debug('Received VNPAY return parameters:', JSON.stringify(params));

            // Extract the secure hash from the params
            const secureHash = params.vnp_SecureHash;
            if (!secureHash) {
                this.logger.warn('Missing secure hash in return parameters');
                return {
                    success: false,
                    error: 'Missing secure hash in return parameters'
                };
            }

            // Create a copy of params without the secure hash for verification
            const paramsWithoutHash = { ...params };
            delete paramsWithoutHash.vnp_SecureHash;
            delete paramsWithoutHash.vnp_SecureHashType;

            // Verify the signature
            const isValidSignature = this.verifyWebhookSignature(paramsWithoutHash, secureHash);
            if (!isValidSignature) {
                this.logger.warn('Invalid signature in return parameters');

                // For debugging: Log the keys and values
                this.logger.debug('Parameter keys:', Object.keys(paramsWithoutHash).sort().join(', '));

                return {
                    success: false,
                    error: 'Invalid signature in return parameters'
                };
            }

            // Check response code
            const responseCode = params.vnp_ResponseCode;
            const transactionStatus = params.vnp_TransactionStatus;

            this.logger.debug(`Response code: ${responseCode}, Transaction status: ${transactionStatus}`);

            if (responseCode === '00' && transactionStatus === '00') {
                return {
                    success: true,
                    paymentIntentId: params.vnp_TxnRef,
                    metadata: {
                        amount: parseInt(params.vnp_Amount, 10) / 100, // Convert back from smallest unit
                        bankCode: params.vnp_BankCode,
                        bankTranNo: params.vnp_BankTranNo,
                        cardType: params.vnp_CardType,
                        orderInfo: params.vnp_OrderInfo,
                        payDate: params.vnp_PayDate,
                        transactionNo: params.vnp_TransactionNo
                    }
                };
            } else {
                return {
                    success: false,
                    paymentIntentId: params.vnp_TxnRef,
                    error: `Payment failed with response code: ${responseCode}`,
                    metadata: {
                        responseCode,
                        transactionStatus
                    }
                };
            }
        } catch (error) {
            this.logger.error(`Failed to process return URL: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process VNPAY IPN (Instant Payment Notification)
     * @param params IPN parameters from VNPAY
     * @returns Processing result with RspCode and Message format
     */
    processIpnNotification(params: Record<string, string>): { RspCode: string; Message: string } {
        try {
            // Extract the secure hash from the params
            const secureHash = params.vnp_SecureHash;
            if (!secureHash) {
                return { RspCode: '97', Message: 'Missing secure hash' };
            }

            // Create a copy of params without the secure hash for verification
            const paramsWithoutHash = { ...params };
            delete paramsWithoutHash.vnp_SecureHash;
            delete paramsWithoutHash.vnp_SecureHashType;

            // Verify the signature
            const isValidSignature = this.verifyWebhookSignature(paramsWithoutHash, secureHash);
            if (!isValidSignature) {
                return { RspCode: '97', Message: 'Fail checksum' };
            }

            // Get transaction reference and response code
            const orderId = params.vnp_TxnRef;
            const rspCode = params.vnp_ResponseCode;

            this.logger.log(`Valid IPN notification received for order ${orderId} with response code ${rspCode}`);

            // The actual order processing and database updates would happen here
            // This is a simplified implementation matching VNPAY documentation format

            return { RspCode: '00', Message: 'success' };
        } catch (error) {
            this.logger.error(`Failed to process IPN: ${error.message}`);
            return { RspCode: '99', Message: `Internal error: ${error.message}` };
        }
    }

    /**
     * Verifies the signature of a VNPAY webhook or redirect
     * @param payload Parameters received from VNPAY
     * @param signature Signature to verify
     * @returns Whether the signature is valid
     */
    verifyWebhookSignature(payload: Record<string, any>, signature: string): boolean {
        try {
            if (!payload || !signature) {
                this.logger.warn('Missing payload or signature');
                return false;
            }

            // Ensure config is initialized
            if (!this.vnpayConfig?.secretKey) {
                this.logger.error('VNPAY configuration not initialized');
                this.initializeDefaults();
            }

            const secretKey = this.vnpayConfig.secretKey;

            // Sort and encode payload exactly as in VNPAY sample
            const sortedPayload = this.sortObject(payload);

            // Create signature string using qs module to match VNPAY exactly
            const signData = qs.stringify(sortedPayload, { encode: false });

            this.logger.debug(`Verification raw signature input: ${signData}`);
            this.logger.debug(`Using secret key: ${secretKey}`);

            // Generate HMAC-SHA512 signature exactly as in VNPAY sample
            const hmac = crypto.createHmac('sha512', secretKey);
            const calculatedSignature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

            this.logger.debug(`Expected signature: ${calculatedSignature}`);
            this.logger.debug(`Received signature: ${signature}`);

            return calculatedSignature.toLowerCase() === signature.toLowerCase();
        } catch (error) {
            this.logger.error(`Signature verification failed: ${error.message}`, error.stack);
            return false;
        }
    }

    /**
     * Handle webhook event
     * @param payload Webhook payload
     */
    async handleWebhookEvent(payload: any): Promise<void> {
        // VNPAY webhook handling is typically done in the payment service
        // This method is a placeholder for interface implementation
        this.logger.debug('Webhook event received:', payload);
    }

    /**
     * Format date to VNPAY required format (YYYYMMDDHHmmss)
     * @param date Date to format
     * @returns Formatted date string
     */
    private formatDateToVnpay(date: Date): string {
        // Format date exactly as in the VNPAY sample (YYYYMMDDHHmmss)
        const pad = (n: number): string => (n < 10 ? `0${n}` : n.toString());

        return (
            date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds())
        );
    }

    /**
     * Sort object by key name and encode values as per VNPAY sample implementation
     * @param obj Object to sort
     * @returns Sorted object with encoded values
     */
    private sortObject(obj: Record<string, any>): Record<string, string> {
        // Implement exactly as in the VNPAY sample
        const sorted: Record<string, string> = {};
        const str: string[] = [];

        // Get all keys
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }

        // Sort keys
        str.sort();

        // Create sorted object with encoded values
        for (let i = 0; i < str.length; i++) {
            const k = str[i];
            const decodedKey = decodeURIComponent(k);
            if (obj[decodedKey] !== undefined && obj[decodedKey] !== null && obj[decodedKey] !== '') {
                sorted[k] = encodeURIComponent(obj[decodedKey]).replace(/%20/g, "+");
            }
        }

        return sorted;
    }
}