import { api } from './api';
import {
  ApiResponse,
  CreatePaymentPayload,
  RazorpayOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from '../types';

export const paymentService = {
  /**
   * Create Razorpay online payment order
   */
  async createRazorpayOrder(payload: CreatePaymentPayload): Promise<RazorpayOrderResponse> {
    const response = await api.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', payload);
    return response.data.data;
  },

  /**
   * Verify Razorpay cryptographic payment signature
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const response = await api.post<ApiResponse<VerifyPaymentResponse>>('/payments/verify', payload);
    return response.data.data;
  },
};
