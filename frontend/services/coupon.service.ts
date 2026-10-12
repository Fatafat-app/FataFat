import { api } from './api';
import { ApiResponse, Coupon } from '../types';

export interface ValidateCouponResponse {
  coupon: {
    code: string;
    discountAmount: number;
  };
  discountAmount: number;
}

export const couponService = {
  /**
   * Get active coupons for customer view
   */
  async getActiveCoupons(restaurantId?: string): Promise<Coupon[]> {
    try {
      const params = restaurantId ? { restaurantId } : {};
      const response = await api.get<ApiResponse<any>>('/coupons/active', { params });
      const data = response.data.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.coupons)) return data.coupons;
      if (data && Array.isArray(data.items)) return data.items;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Validate a coupon against cart total & restaurant
   */
  async validateCoupon(code: string, cartTotal: number, restaurantId?: string): Promise<ValidateCouponResponse> {
    const response = await api.post<ApiResponse<ValidateCouponResponse>>('/coupons/validate', {
      code: code.trim().toUpperCase(),
      cartTotal,
      restaurantId,
    });
    return response.data.data;
  },
};
