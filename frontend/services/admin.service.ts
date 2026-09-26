import { api } from './api';
import { ApiResponse, PaginatedData, User, Restaurant, Coupon, CreateCouponPayload, FlashDealConfig } from '../types';

export interface AdminDashboardOverview {
  users: { total: number };
  restaurants: { total: number };
  orders: {
    active: number;
    total: number;
  };
  logistics: {
    onlineRiders: number;
  };
  finance: {
    totalRevenue: number; // in paise
    totalDeliveryFees: number; // in paise
  };
}

export interface CreateRestaurantPayload {
  name: string;
  description?: string;
  cuisines: string[];
  ownerId?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    location: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  pricing: {
    costForTwo: number; // in paise
    deliveryCharge: number; // in paise
  };
  estimatedDeliveryTime?: number;
  images?: string[];
  isPureVeg?: boolean;
}

export const adminService = {
  /**
   * Get platform-wide overview metrics
   */
  async getDashboardOverview(): Promise<AdminDashboardOverview> {
    const response = await api.get<ApiResponse<AdminDashboardOverview>>('/admin/dashboard');
    return response.data.data;
  },

  /**
   * List platform users with filter & search
   */
  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedData<User>> {
    const response = await api.get<ApiResponse<PaginatedData<User>>>('/admin/users', { params });
    return response.data.data;
  },

  /**
   * Update user active status or role (e.g. make restaurant owner)
   */
  async updateUser(
    userId: string,
    payload: { isActive?: boolean; role?: string }
  ): Promise<User> {
    const response = await api.patch<ApiResponse<{ user: User }>>(`/admin/users/${userId}`, payload);
    return response.data.data.user;
  },

  /**
   * List all partner restaurants
   */
  async listAllRestaurants(): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<Restaurant[] | PaginatedData<Restaurant>>>('/restaurants', {
      params: { limit: 100 },
    });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && 'items' in data && Array.isArray((data as any).items)) return (data as any).items;
    return [];
  },

  /**
   * Create and onboard new restaurant
   */
  async createRestaurant(payload: CreateRestaurantPayload): Promise<Restaurant> {
    const response = await api.post<ApiResponse<{ restaurant: Restaurant }>>('/restaurants', payload);
    return response.data.data.restaurant || (response.data.data as any);
  },

  /**
   * Toggle restaurant active status
   */
  async updateRestaurantStatus(
    restaurantId: string,
    payload: { isActive?: boolean; isVerified?: boolean }
  ): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<{ restaurant: Restaurant }>>(
      `/admin/restaurants/${restaurantId}/status`,
      payload
    );
    return response.data.data.restaurant;
  },

  /**
   * List all discount coupons
   */
  async listCoupons(): Promise<Coupon[]> {
    const response = await api.get<ApiResponse<{ items: Coupon[] } | Coupon[]>>('/coupons');
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && 'items' in data) return (data as any).items;
    return [];
  },

  /**
   * Create a new discount coupon
   */
  async createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
    const response = await api.post<ApiResponse<{ coupon: Coupon }>>('/coupons', payload);
    return response.data.data.coupon;
  },

  /**
   * Toggle coupon active/inactive
   */
  async toggleCoupon(couponId: string): Promise<Coupon> {
    const response = await api.patch<ApiResponse<{ coupon: Coupon }>>(`/coupons/${couponId}/toggle`);
    return response.data.data.coupon;
  },
};
