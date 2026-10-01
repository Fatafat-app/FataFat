import { api } from './api';
import { ApiResponse } from '../types';

export interface CheckoutSessionItem {
  listingId: string;
  quantity: number;
  variants?: any[];
  addons?: any[];
}

export interface CreateCheckoutSessionPayload {
  items: CheckoutSessionItem[];
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    location?: {
      type: string;
      coordinates: number[];
    };
  };
  couponCode?: string;
  paymentMethod?: 'ONLINE' | 'COD';
  idempotencyKey?: string;
}

export interface CheckoutSessionResponse {
  session: {
    _id: string;
    status: string;
    expiresAt: string;
    orders: string[] | any[];
    pricing: {
      itemsPaise: number;
      packagingPaise: number;
      deliveryPaise: number;
      taxPaise: number;
      discountPaise: number;
      totalPaise: number;
    };
    razorpayOrderId?: string;
    paymentMethod: string;
  };
  orders: any[];
  razorpayOrderId?: string;
  amountPaise: number;
}

export const checkoutService = {
  /**
   * Create a server-authoritative checkout session with stock reservation & Razorpay order
   */
  async createSession(payload: CreateCheckoutSessionPayload): Promise<CheckoutSessionResponse> {
    const response = await api.post<ApiResponse<CheckoutSessionResponse>>('/checkout/sessions', payload, {
      headers: payload.idempotencyKey ? { 'X-Idempotency-Key': payload.idempotencyKey } : {},
    });
    return response.data.data;
  },

  /**
   * Get single session status
   */
  async getSession(sessionId: string): Promise<CheckoutSessionResponse['session']> {
    const response = await api.get<ApiResponse<{ session: any }>>(`/checkout/sessions/${sessionId}`);
    return response.data.data.session;
  },
};
