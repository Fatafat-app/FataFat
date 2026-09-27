import { api } from './api';
import { ApiResponse, PaginatedData, Order } from '../types';

export interface DeliveryPartner {
  _id: string;
  user: any; // User object or ID
  vehicle: {
    type: string;
    model: string;
    licenseNumber: string;
  };
  isOnline: boolean;
  isAvailable: boolean;
  activeOrder: Order | null;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  earnings: {
    total: number;
    today: number;
    pendingPayout: number;
  };
  stats: {
    completedDeliveries: number;
    rating: number;
  };
}

export interface DeliveryHistoryResponse {
  orders: Order[];
  partnerEarnings: DeliveryPartner['earnings'];
  partnerStats: DeliveryPartner['stats'];
  meta: any;
}

export const deliveryService = {
  /**
   * Register as a new delivery partner
   */
  async registerPartner(payload: any): Promise<DeliveryPartner> {
    const response = await api.post<ApiResponse<{ partner: DeliveryPartner }>>('/delivery/register', payload);
    return response.data.data.partner;
  },

  /**
   * Get current partner profile, active status, earnings, active order
   */
  async getProfile(): Promise<DeliveryPartner> {
    const response = await api.get<ApiResponse<{ partner: DeliveryPartner }>>('/delivery/profile');
    return response.data.data.partner;
  },

  /**
   * Toggle online/offline to receive orders
   */
  async toggleOnline(isOnline: boolean): Promise<DeliveryPartner> {
    const response = await api.patch<ApiResponse<{ partner: DeliveryPartner }>>('/delivery/toggle-online', { isOnline });
    return response.data.data.partner;
  },

  /**
   * Post background location updates
   */
  async updateLocation(latitude: number, longitude: number, orderId?: string): Promise<{ updated: boolean; coordinates: [number, number] }> {
    const response = await api.post<ApiResponse<{ updated: boolean; coordinates: [number, number] }>>('/delivery/location', {
      latitude,
      longitude,
      orderId,
    });
    return response.data.data;
  },

  /**
   * Transition delivery status (e.g. OUT_FOR_DELIVERY, DELIVERED)
   */
  async updateDeliveryStatus(orderId: string, status: string): Promise<{ success: boolean; orderStatus: string }> {
    const response = await api.patch<ApiResponse<{ success: boolean; orderStatus: string }>>(`/delivery/orders/${orderId}/status`, {
      status,
    });
    return response.data.data;
  },

  /**
   * Get past deliveries and earnings summary
   */
  async getHistory(params?: { page?: number; limit?: number }): Promise<DeliveryHistoryResponse> {
    const response = await api.get<ApiResponse<DeliveryHistoryResponse>>('/delivery/history', { params });
    return response.data.data;
  }
};
