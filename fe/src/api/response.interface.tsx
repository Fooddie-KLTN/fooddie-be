import { Order } from "@/interface";

export interface PaginatedResponse<T> {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface OrderResponse {
  order: Order;
  paymentUrl?: string;
  checkoutId?: string;
}

export interface CalculateOrderResponse {
    foodTotal: number;
    shippingFee: number;
    distance: number;
    total: number;
    }