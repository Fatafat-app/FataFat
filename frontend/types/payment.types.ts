export interface CreatePaymentPayload {
  orderId: string;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;       // in paise
  currency: string;     // 'INR'
  keyId: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  orderId: string;
  paymentStatus: 'PAID' | 'FAILED';
  message: string;
}
