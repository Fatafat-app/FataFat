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

function normalizeOwnerOrder(order: any): Order {
  if (!order) return order;
  const items = (order.items || []).map((it: any) => ({
    menuItemId: it.menuItemId || it.menuItem?._id || it.menuItem || '',
    name: it.name || it.menuItem?.name || 'Dish Item',
    quantity: it.quantity || 1,
    price: it.price || 0,
    selectedModifiers: it.selectedModifiers || [],
    totalItemPrice: it.totalPrice || it.totalItemPrice || ((it.price || 0) * (it.quantity || 1)),
  }));

  const itemsTotal = order.subtotal || items.reduce((sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1), 0);
  const deliveryFee = order.deliveryFee || 0;
  const gstAndTaxes = order.taxAmount || 0;
  const platformFee = 500;
  const discount = order.discountAmount || 0;
  const totalAmount = order.totalAmount || (itemsTotal + deliveryFee + gstAndTaxes + platformFee - discount);

  const rawStatus = (order.orderStatus || order.status || 'PENDING').toString().toUpperCase();
  const rest = order.restaurant || order.restaurantId;

  return {
    ...order,
    _id: order._id?.toString() || '',
    orderNumber: order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'FTFT'),
    user: order.user || order.customer || null,
    restaurant: rest,
    restaurantId: rest,
    items,
    pricing: order.pricing || {
      itemsTotal,
      deliveryFee,
      gstAndTaxes,
      platformFee,
      discount,
      totalAmount,
    },
    status: rawStatus as any,
    orderStatus: rawStatus as any,
    deliveryAddress: order.deliveryAddress ? {
      ...order.deliveryAddress,
      line1: order.deliveryAddress.line1 || order.deliveryAddress.street || '',
      line2: order.deliveryAddress.line2 || '',
      city: order.deliveryAddress.city || '',
      state: order.deliveryAddress.state || '',
      pincode: order.deliveryAddress.pincode || '',
      label: order.deliveryAddress.label || order.deliveryAddress.type || 'Home',
    } : order.deliveryAddress,
  };
}

export const ownerService = {
  /**
   * Get the logged-in owner's restaurants
   */
  async getMyRestaurants(): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<any>>('/restaurants/owner/mine');
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.restaurants)) return data.restaurants;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },

  /**
   * Toggle store online / offline (isOpen)
   */
  async toggleStoreOpen(restaurantId: string): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<any>>(`/restaurants/${restaurantId}/toggle-open`);
    const data = response.data.data;
    return data?.restaurant || data;
  },

  /**
   * Update restaurant details
   */
  async updateRestaurant(restaurantId: string, updates: Partial<Restaurant>): Promise<Restaurant> {
    const response = await api.patch<ApiResponse<any>>(`/restaurants/${restaurantId}`, updates);
    const data = response.data.data;
    return data?.restaurant || data;
  },

  /**
   * Fetch all orders for this restaurant with optional status filter
   */
  async getRestaurantOrders(restaurantId: string, status?: string): Promise<Order[]> {
    const response = await api.get<ApiResponse<any>>(`/orders/restaurant/${restaurantId}`, {
      params: status ? { status } : undefined,
    });
    const data = response.data.data;
    const rawList = Array.isArray(data) ? data : (data?.orders || data?.items || []);
    return rawList.map(normalizeOwnerOrder);
  },

  /**
   * Update order status (Accept -> PREPARING, Mark Ready -> READY_FOR_PICKUP, Cancel)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, cancellationReason?: string): Promise<Order> {
    const response = await api.patch<ApiResponse<any>>(`/orders/${orderId}/status`, {
      status,
      cancellationReason,
    });
    const data = response.data.data;
    const orderObj = data?.order || data;
    return normalizeOwnerOrder(orderObj);
  },

  /**
   * Toggle item availability (In-Stock / Out-of-Stock)
   */
  async toggleItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean): Promise<MenuItem> {
    const response = await api.patch<ApiResponse<any>>(
      `/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
      { isAvailable }
    );
    const data = response.data.data;
    return data?.item || data;
  },

  /**
   * Add a new dish to the restaurant menu
   */
  async addMenuItem(restaurantId: string, payload: CreateMenuItemPayload): Promise<MenuItem> {
    const response = await api.post<ApiResponse<any>>(
      `/restaurants/${restaurantId}/menu/items`,
      payload
    );
    const data = response.data.data;
    return data?.item || data;
  },

  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    payload: Partial<CreateMenuItemPayload>
  ): Promise<MenuItem> {
    const response = await api.patch<ApiResponse<any>>(
      `/restaurants/${restaurantId}/menu/items/${itemId}`,
      payload
    );
    const data = response.data.data;
    return data?.item || data;
  },

  async addCategory(restaurantId: string, name: string): Promise<MenuCategory> {
    const response = await api.post<ApiResponse<any>>(
      `/restaurants/${restaurantId}/menu/categories`,
      { name }
    );
    const data = response.data.data;
    return data?.category || data;
  },
};

