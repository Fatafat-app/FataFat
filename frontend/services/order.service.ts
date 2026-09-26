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
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/orders', payload);
    return response.data.data;
  },

  /**
   * Fetch customer's order history with pagination
   */
  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedData<Order>> {
    const response = await api.get<ApiResponse<PaginatedData<Order>>>('/orders', {
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
   * Cancel an order if it hasn't reached preparing state yet
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data.data;
  },
};
