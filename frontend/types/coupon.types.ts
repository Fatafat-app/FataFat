export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  value: number; // percent (0-100) or flat paise amount
  minOrderAmount: number; // in paise
  maxDiscount?: number; // in paise
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  restaurantId?: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  value: number;
  minOrderAmount: number; // in paise
  maxDiscount?: number; // in paise
  expiresAt: string;
  isActive?: boolean;
}

export interface FlashDealConfig {
  isEnabled: boolean;
  title: string;
  discountText: string;
  durationSeconds: number; // timer countdown (e.g. 7200 for 2 hours)
  imageUrl?: string;
  targetCategory?: string;
}
