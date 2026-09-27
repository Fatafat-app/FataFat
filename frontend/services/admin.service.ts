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
    const response = await api.get<ApiResponse<any>>('/admin/users', { params });
    const data = response.data.data;
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page: 1, limit: data.length, hasMore: false };
    }
    const userList = data?.users || data?.items || [];
    return {
      items: userList,
      total: data?.meta?.total || userList.length,
      page: data?.meta?.page || 1,
      limit: data?.meta?.limit || userList.length,
      hasMore: false,
    };
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
    const response = await api.get<ApiResponse<any>>('/restaurants', {
      params: { limit: 100 },
    });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.restaurants)) return data.restaurants;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },

  /**
   * Create and onboard new restaurant
   */
  async createRestaurant(payload: CreateRestaurantPayload): Promise<Restaurant> {
    const response = await api.post<ApiResponse<any>>('/restaurants', payload);
    const data = response.data.data;
    return data?.restaurant || data;
  },

  /**
   * Toggle restaurant active status
   */
  async updateRestaurantStatus(
    restaurantId: string,
    payload: { isActive?: boolean; isVerified?: boolean }
  ): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<any>>(
      `/admin/restaurants/${restaurantId}/status`,
      payload
    );
    const data = response.data.data;
    return data?.restaurant || data;
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

  /**
   * Get dynamic platform fee & tax settings
   */
  async getFeeConfig(): Promise<FeeConfig> {
    const response = await api.get<ApiResponse<{ config: FeeConfig }>>('/admin/fees');
    return response.data.data.config;
  },

  /**
   * Get all categories for admin management
   */
  async getCategories(onlyActive?: boolean): Promise<CategoryItem[]> {
    const response = await api.get<ApiResponse<{ categories: CategoryItem[] }>>('/admin/categories', {
      params: onlyActive ? { onlyActive: true } : undefined,
    });
    return response.data.data.categories;
  },

  /**
   * Create new category
   */
  async createCategory(payload: CreateCategoryPayload): Promise<CategoryItem> {
    const response = await api.post<ApiResponse<{ category: CategoryItem }>>('/admin/categories', payload);
    return response.data.data.category;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, payload: Partial<CreateCategoryPayload>): Promise<CategoryItem> {
    const response = await api.put<ApiResponse<{ category: CategoryItem }>>(`/admin/categories/${id}`, payload);
    return response.data.data.category;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  },

  /**
   * Reorder categories
   */
  async reorderCategories(items: { id: string; order: number }[]): Promise<CategoryItem[]> {
    const response = await api.put<ApiResponse<{ categories: CategoryItem[] }>>('/admin/categories/reorder', {
      items,
    });
    return response.data.data.categories;
  },
};

export interface CategoryItem {
  _id: string;
  name: string;
  image: string;
  order: number;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  image: string;
  order?: number;
  isActive?: boolean;
  description?: string;
}

export interface CustomFeeItem {
  _id?: string;
  name: string;
  amount: number; // in paise
  isEnabled: boolean;
  description?: string;
}

export interface FeeConfig {
  _id?: string;
  platformFee: number; // in paise
  platformFeeEnabled: boolean;
  taxPercent: number; // e.g. 5
  taxEnabled: boolean;
  baseDeliveryFee: number; // in paise
  deliveryFeeEnabled: boolean;
  packagingFee: number; // in paise
  packagingFeeEnabled: boolean;
  surgeFee: number; // in paise
  surgeFeeEnabled: boolean;
  customFees: CustomFeeItem[];
  updatedAt?: string;
}
