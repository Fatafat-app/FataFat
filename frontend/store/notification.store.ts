import { create } from 'zustand';
import { notificationService, Notification } from '../services/notification.service';

export interface InAppBanner {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  activeBanner: InAppBanner | null;

  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  showInAppNotification: (title: string, body: string, type?: string, data?: any) => void;
  dismissBanner: () => void;
}

let bannerTimeout: any = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  activeBanner: null,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const data = await notificationService.getNotifications(1, 50);
      set({
        notifications: data.notifications || [],
        unreadCount: data.pagination?.unreadCount ?? (data.notifications || []).filter((n) => !n.isRead).length,
      });
    } catch (err) {
      console.warn('[NotificationStore] Fetch notifications failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.warn('[NotificationStore] Mark all read failed:', err);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => {
        const updated = state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        return {
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch (err) {
      console.warn('[NotificationStore] Mark as read failed:', err);
    }
  },

  showInAppNotification: (title: string, body: string, type = 'general', data = {}) => {
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
    }

    const banner: InAppBanner = {
      id: String(Date.now()),
      title,
      body,
      type,
      data,
    };

    set({ activeBanner: banner });

    // Increase unread count and refresh notification list in background
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
    get().fetchNotifications().catch(() => {});

    // Auto dismiss after 4.5 seconds
    bannerTimeout = setTimeout(() => {
      set({ activeBanner: null });
    }, 4500);
  },

  dismissBanner: () => {
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
    }
    set({ activeBanner: null });
  },
}));
