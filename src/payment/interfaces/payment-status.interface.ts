/**
 * Payment status response interface
 * Represents the status of a payment for an order
 */
export interface PaymentStatusResponse {
  /** Order identifier */
  orderId: string;
  /** Status of the order (pending, completed, failed, etc.) */
  status: string;
  /** Total amount of the order */
  amount: number;
  /** Currency code (VND, USD, etc.) */
  currency: string;
  /** Checkout identifier */
  checkoutId: string;
  /** Status of the checkout */
  checkoutStatus: string;
  /** Status of the payment intent (if available) */
  paymentIntentStatus?: string;
  /** Payment method used */
  paymentMethod: string;
  /** Additional metadata related to the payment */
  metadata?: Record<string, any>;
}