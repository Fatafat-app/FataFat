import { api } from './api';
import {
  ApiResponse,
  PaginatedData,
  Order,
  CreateOrderPayload,
  EstimateOrderPayload,
  EstimateOrderResponse,
} from '../types';

function normalizeOrder(order: any): Order {
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
      label: order.deliveryAddress.label || order.deliveryAddress.type || 'Home',
    } : order.deliveryAddress,
  };
}

export const orderService = {
  /**
   * Calculate live pricing breakdown and delivery estimates before placing order
   */
  async estimateOrder(payload: EstimateOrderPayload): Promise<EstimateOrderResponse> {
    const response = await api.post<ApiResponse<EstimateOrderResponse>>('/orders/estimate', payload);
    return response.data.data;
  },

  /**
   * Place a new food order
   */
  async createOrder(payload: CreateOrderPayload): Promise<{ order: Order; payment?: any }> {
    const response = await api.post<ApiResponse<any>>('/orders', payload);
    const data = response.data.data;
    return {
      order: normalizeOrder(data?.order || data),
      payment: data?.payment,
    };
  },

  /**
   * Fetch customer's order history with pagination
   */
  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedData<Order>> {
    const response = await api.get<ApiResponse<any>>('/orders/mine', {
      params,
    });
    const raw = response.data.data;
    const rawOrders = Array.isArray(raw) ? raw : (raw?.orders || raw?.items || []);
    return {
      items: rawOrders.map(normalizeOrder),
      total: raw?.meta?.total || rawOrders.length,
      page: raw?.meta?.page || 1,
      limit: raw?.meta?.limit || rawOrders.length,
      hasMore: false,
    };
  },

  /**
   * Get single order details by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<any>>(`/orders/${orderId}`);
    const raw = response.data.data;
    const orderObj = raw?.order || raw;
    return normalizeOrder(orderObj);
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    throw new Error('Cancel order feature is not supported by the backend yet.');
  },

  /**
   * Fetch current active platform fee and tax configuration
   */
  async getCurrentFees(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/orders/fees/current');
    return response.data.data?.config;
  },
};
