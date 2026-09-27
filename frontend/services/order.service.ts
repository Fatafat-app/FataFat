import { api } from './api';
import {
  ApiResponse,
  PaginatedData,
  Order,
  CreateOrderPayload,
  EstimateOrderPayload,
  EstimateOrderResponse,
} from '../types';

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
    const response = await api.post<ApiResponse<{ order: Order; payment?: any }>>('/orders', payload);
    return response.data.data;
  },

  /**
   * Fetch customer's order history with pagination
   */
  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedData<Order>> {
    // The real backend uses /orders/mine
    const response = await api.get<ApiResponse<PaginatedData<Order>>>('/orders/mine', {
      params,
    });
    return response.data.data;
  },

  /**
   * Get single order details by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },

  /**
   * Cancel an order - UNSUPPORTED BY BACKEND (Phase 11 Compliance)
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    throw new Error('Cancel order feature is not supported by the backend yet.');
  },
};
