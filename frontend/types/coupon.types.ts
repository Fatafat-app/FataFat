export type CouponDiscountType = 'percent' | 'flat' | 'percentage';

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  value?: number; // percent (0-100) or flat paise amount
  discountValue?: number;
  minOrderAmount?: number; // in paise
  minOrderValue?: number;
  maxDiscount?: number; // in paise
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  perUserLimit?: number;
  restaurantId?: string;
  expiresAt?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  value?: number;
  discountValue?: number;
  minOrderAmount?: number; // in paise
  minOrderValue?: number;
  maxDiscount?: number; // in paise
  maxDiscountAmount?: number;
  usageLimit?: number;
  validUntil?: string;
  expiresAt?: string;
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
