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
   * List vertical feature flags
   */
  async getVerticals(): Promise<any[]> {
    const response = await api.get<ApiResponse<{ flags: any[] }>>('/config/verticals');
    return response.data.data?.flags || [];
  },

  /**
   * Set vertical mode (ON, DRAIN, OFF)
   */
  async setVerticalMode(vertical: 'food' | 'grocery', payload: { mode: 'ON' | 'DRAIN' | 'OFF'; message?: any; reason?: string }): Promise<any> {
    const response = await api.put<ApiResponse<{ flag: any }>>(`/config/verticals/${vertical}`, payload);
    return response.data.data?.flag;
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
   * List all partner restaurants / vendors
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
   * Delete coupon
   */
  async deleteCoupon(couponId: string): Promise<void> {
    await api.delete(`/coupons/${couponId}`);
  },

  /**
   * Get dynamic platform fee & tax settings
   */
  async getFeeConfig(): Promise<FeeConfig> {
    const response = await api.get<ApiResponse<{ config: FeeConfig }>>('/admin/fees');
    return response.data.data.config;
  },

  /**
   * Update platform fee & tax settings
   */
  async updateFeeConfig(payload: Partial<FeeConfig>): Promise<FeeConfig> {
    const response = await api.put<ApiResponse<{ config: FeeConfig }>>('/admin/fees', payload);
    return response.data.data.config;
  },

  /**
   * Get system audit logs
   */
  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; resource?: string }): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/admin/audit-logs', { params });
    return response.data.data;
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

  /**
   * List all platform orders across Food & Grocery verticals with status filter
   */
  async listOrders(params?: {
    page?: number;
    limit?: number;
    vertical?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedData<any>> {
    const response = await api.get<ApiResponse<any>>('/admin/orders', { params });
    const data = response.data.data;
    const orderList = Array.isArray(data) ? data : (data?.orders || data?.items || []);
    return {
      items: orderList,
      total: data?.meta?.total || orderList.length,
      page: data?.meta?.page || 1,
      limit: data?.meta?.limit || orderList.length,
      hasMore: false,
    };
  },

  /**
   * Super Admin / Ops status override
   */
  async updateOrderStatus(orderId: string, payload: { status: string; reason?: string }): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/admin/orders/${orderId}/status`, payload);
    return response.data.data?.order || response.data.data;
  },

  /**
   * Send Push / In-app Broadcast Notification to users, riders, or owners
   */
  async sendNotification(payload: BroadcastNotificationPayload): Promise<BroadcastNotificationResult> {
    const response = await api.post<ApiResponse<BroadcastNotificationResult>>('/admin/notifications', payload);
    return response.data.data;
  },

  /**
   * Get past broadcast notification history
   */
  async getNotificationHistory(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/admin/notifications', { params });
    return response.data.data;
  },

  /**
   * Grocery Products Admin
   */
  async listGroceryProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeUnavailable?: boolean;
    includeInactive?: boolean;
  }): Promise<{ products: any[]; total: number; page: number; totalPages: number }> {
    const response = await api.get<ApiResponse<{ products: any[] }>>('/grocery/products', {
      params: {
        includeUnavailable: true,
        includeInactive: true,
        limit: 100,
        ...params,
      },
    });
    return {
      products: response.data.data?.products || [],
      total: response.data.meta?.total || response.data.data?.products?.length || 0,
      page: response.data.meta?.page || 1,
      totalPages: response.data.meta?.totalPages || 1,
    };
  },

  async createGroceryProduct(payload: any): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/grocery/products', payload);
    return response.data.data?.product || response.data.data;
  },

  async updateGroceryProduct(id: string, payload: any): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/grocery/products/${id}`, payload);
    return response.data.data?.product || response.data.data;
  },

  async toggleGroceryProductAvailability(id: string): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/grocery/products/${id}/availability`);
    return response.data.data;
  },

  async deleteGroceryProduct(id: string): Promise<void> {
    await api.delete(`/grocery/products/${id}`);
  },

  async listGroceryCategories(): Promise<any[]> {
    const response = await api.get<ApiResponse<{ categories: any[] }>>('/grocery/categories');
    return response.data.data?.categories || [];
  },

  /**
   * Restaurant Menu Admin Management
   */
  async getRestaurantMenu(restaurantId: string): Promise<any[]> {
    const response = await api.get<ApiResponse<{ menu: any[] }>>(`/restaurants/${restaurantId}/menu`);
    return response.data.data?.menu || [];
  },

  async addRestaurantMenuItem(restaurantId: string, payload: any): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/restaurants/${restaurantId}/menu/items`, payload);
    return response.data.data?.item || response.data.data;
  },

  async updateRestaurantMenuItem(restaurantId: string, itemId: string, payload: any): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/restaurants/${restaurantId}/menu/items/${itemId}`, payload);
    return response.data.data?.item || response.data.data;
  },

  async toggleRestaurantMenuItemAvailability(restaurantId: string, itemId: string): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/restaurants/${restaurantId}/menu/items/${itemId}/availability`);
    return response.data.data;
  },

  async deleteRestaurantMenuItem(restaurantId: string, itemId: string): Promise<void> {
    await api.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`);
  },

  async addRestaurantCategory(restaurantId: string, payload: { name: string; sortOrder?: number }): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/restaurants/${restaurantId}/menu/categories`, payload);
    return response.data.data;
  },

  async deleteRestaurantCategory(restaurantId: string, categoryId: string): Promise<void> {
    await api.delete(`/restaurants/${restaurantId}/menu/categories/${categoryId}`);
  },
};

export interface BroadcastNotificationPayload {
  title: string;
  body: string;
  targetAudience: 'all' | 'customers' | 'riders' | 'owners' | 'user';
  type?: 'announcement' | 'promotion' | 'alert' | 'offer' | 'system';
  imageUrl?: string;
  userId?: string;
}

export interface BroadcastNotificationResult {
  title: string;
  body: string;
  targetAudience: string;
  type: string;
  recipientCount: number;
  fcmTokensCount: number;
  fcmSuccessCount: number;
  sentAt: string;
}

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
