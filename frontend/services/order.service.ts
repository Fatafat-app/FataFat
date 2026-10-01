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
  const items = (order.items || []).map((it: any) => {
    const rawPrice = it.pricePaise !== undefined ? it.pricePaise : (it.price || 0);
    const rawTotal = it.totalPaise !== undefined ? it.totalPaise : (it.totalPrice || it.totalItemPrice || (rawPrice * (it.quantity || 1)));
    return {
      menuItemId: it.listingId || it.itemId || it.menuItemId || it.menuItem?._id || it.menuItem || '',
      name: it.name || it.menuItem?.name || it.itemId?.name || 'Item',
      quantity: it.quantity || 1,
      price: rawPrice,
      selectedModifiers: it.selectedModifiers || it.addons || [],
      totalItemPrice: rawTotal,
      menuItem: it.menuItem || it.itemId || {
        _id: it.itemId || it.menuItemId,
        name: it.name,
        images: it.menuItem?.images || it.itemId?.images || (it.image ? [it.image] : []),
        isVeg: it.isVeg !== undefined ? it.isVeg : it.menuItem?.isVeg,
      },
    };
  });

  const totalPaise = order.pricing?.totalPaise || order.pricing?.totalAmount || order.totalAmount || 0;
  const rawStatus = (order.orderStatus || order.status || 'PLACED').toString().toUpperCase();
  const vendorOrRest = order.vendorId || order.restaurant || order.restaurantId;

  return {
    ...order,
    _id: order._id?.toString() || '',
    orderNumber: order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'FTFT'),
    restaurant: vendorOrRest,
    restaurantId: vendorOrRest,
    vendor: order.vendorId || order.vendor,
    items,
    pricing: {
      itemsTotal: order.pricing?.itemsPaise || order.pricing?.itemsTotal || order.subtotal || 0,
      deliveryFee: order.pricing?.deliveryPaise || order.pricing?.deliveryFee || order.deliveryFee || 0,
      gstAndTaxes: order.pricing?.taxPaise || order.pricing?.gstAndTaxes || order.taxAmount || 0,
      platformFee: order.pricing?.platformFee || 500,
      discount: order.pricing?.discountPaise || order.pricing?.discount || order.discountAmount || 0,
      totalAmount: totalPaise,
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
    const response = await api.patch<ApiResponse<any>>(`/orders/${orderId}/cancel`, { reason });
    const raw = response.data.data;
    const orderObj = raw?.order || raw;
    return normalizeOrder(orderObj);
  },

  /**
   * Fetch current active platform fee and tax configuration
   */
  async getCurrentFees(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/orders/fees/current');
    return response.data.data?.config;
  },
};
