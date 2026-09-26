import { api } from './api';
import {
  ApiResponse,
  PaginatedData,
  Restaurant,
  Order,
  OrderStatus,
  MenuItem,
  MenuCategory,
} from '../types';

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number; // in paise
  description?: string;
  isVeg: boolean;
  isAvailable?: boolean;
  preparationTime?: number;
  calories?: number;
  images?: string[];
}

export const ownerService = {
  /**
   * Get the logged-in owner's restaurants
   */
  async getMyRestaurants(): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<Restaurant[] | { items: Restaurant[] }>>('/restaurants/owner/mine');
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && 'items' in data && Array.isArray((data as any).items)) return (data as any).items;
    return [];
  },

  /**
   * Toggle store online / offline (isOpen)
   */
  async toggleStoreOpen(restaurantId: string): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}/toggle-open`);
    return response.data.data;
  },

  /**
   * Update restaurant details
   */
  async updateRestaurant(restaurantId: string, updates: Partial<Restaurant>): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}`, updates);
    return response.data.data;
  },

  /**
   * Fetch all orders for this restaurant with optional status filter
   */
  async getRestaurantOrders(restaurantId: string, status?: string): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[] | PaginatedData<Order>>>(`/orders/restaurant/${restaurantId}`, {
      params: status ? { status } : undefined,
    });
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && 'items' in data && Array.isArray((data as any).items)) return (data as any).items;
    return [];
  },

  /**
   * Update order status (Accept -> PREPARING, Mark Ready -> READY_FOR_PICKUP, Cancel)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, cancellationReason?: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, {
      status,
      cancellationReason,
    });
    return response.data.data;
  },

  /**
   * Toggle item availability (In-Stock / Out-of-Stock)
   */
  async toggleItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean): Promise<MenuItem> {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
      { isAvailable }
    );
    return response.data.data;
  },

  /**
   * Add a new dish to the restaurant menu
   */
  async addMenuItem(restaurantId: string, payload: CreateMenuItemPayload): Promise<MenuItem> {
    const response = await api.post<ApiResponse<MenuItem>>(
      `/restaurants/${restaurantId}/menu/items`,
      payload
    );
    return response.data.data;
  },

  /**
   * Update dish details
   */
  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    payload: Partial<CreateMenuItemPayload>
  ): Promise<MenuItem> {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/restaurants/${restaurantId}/menu/items/${itemId}`,
      payload
    );
    return response.data.data;
  },
};
