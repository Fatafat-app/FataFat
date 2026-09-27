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
   * Confirm Razorpay online payment
   */
  async confirmPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const response = await api.post<ApiResponse<VerifyPaymentResponse>>('/payments/confirm', payload);
    return response.data.data;
  },
};
