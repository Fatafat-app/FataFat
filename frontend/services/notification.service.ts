import { api } from './api';
import { ApiResponse } from '../types';

export interface Notification {
  _id: string;
  user: string;
  title: string;
  body: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  unreadCount: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export const notificationService = {
  /**
   * Get user notifications with pagination
   */
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const response = await api.get<ApiResponse<NotificationsResponse>>('/notifications', {
      params: { page, limit }
    });
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(token: string): Promise<void> {
    await api.put('/users/me/fcm-token', { fcmToken: token });
  }
};
