import { io, Socket } from 'socket.io-client';
import { getAccessToken, getSocketUrl } from './api';
import { useOrderTrackingStore } from '../store/orderTracking.store';
import { useConfigStore } from '../store/config.store';
import { useNotificationStore } from '../store/notification.store';
import { LocationUpdateEvent, StatusUpdateEvent } from '../types';

const statusMessages: Record<string, { title: string; body: string }> = {
  placed: { title: 'Order Placed 🛍️', body: 'Your order was placed successfully!' },
  accepted: { title: 'Order Confirmed 🎉', body: 'Merchant has confirmed and accepted your order!' },
  confirmed: { title: 'Order Confirmed 🎉', body: 'Merchant has confirmed your order!' },
  preparing: { title: 'Preparing Food 👨‍🍳', body: 'Kitchen is now preparing your delicious meal.' },
  ready: { title: 'Order Ready 📦', body: 'Your order is packed and ready for delivery partner.' },
  ready_for_pickup: { title: 'Order Ready 📦', body: 'Your order is packed and ready for delivery partner.' },
  picked_up: { title: 'Out For Delivery 🛵', body: 'Rider picked up your order and is on the way!' },
  out_for_delivery: { title: 'Out For Delivery 🛵', body: 'Rider is on the way with your order!' },
  delivered: { title: 'Order Delivered 🍽️', body: 'Order delivered successfully. Enjoy your meal!' },
  cancelled: { title: 'Order Cancelled ❌', body: 'Your order has been cancelled.' },
  rejected: { title: 'Order Rejected ⚠️', body: 'Merchant could not accept your order.' },
};

class SocketService {
  private socket: Socket | null = null;
  private currentOrderId: string | null = null;

  /**
   * Initialize socket connection with JWT authorization token
   */
  async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = await getAccessToken();
    const socketUrl = getSocketUrl();

    this.socket = io(socketUrl, {
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', this.socket?.id);
      if (this.currentOrderId) {
        this.joinOrderRoom(this.currentOrderId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // 1. Config & Vertical Switch Events
    this.socket.on('config:updated', (payload) => {
      console.log('[Socket] Config updated:', payload);
      useConfigStore.getState().fetchBootstrap();
    });

    this.socket.on('vertical.toggled.v1', (payload) => {
      console.log('[Socket] Vertical toggled:', payload);
      useConfigStore.getState().fetchBootstrap();
    });

    // 2. Legacy status update events
    this.socket.on('order:status_updated', (data: StatusUpdateEvent) => {
      console.log('[Socket] Order status updated (legacy):', data);
      useOrderTrackingStore.getState().updateOrderStatus(data.status);
      const msg = statusMessages[data.status.toLowerCase()] || {
        title: 'Order Updated 🔔',
        body: `Order status is now ${data.status}`,
      };
      useNotificationStore.getState().showInAppNotification(msg.title, msg.body, 'order_status', {
        orderId: data.orderId,
      });
    });

    // 3. V2 Outbox Domain Events
    const v2Events = [
      'order.placed.v1',
      'order.accepted.v1',
      'order.preparing.v1',
      'order.ready.v1',
      'order.picked_up.v1',
      'order.delivered.v1',
      'order.cancelled.v1',
      'order.rejected.v1',
    ];

    v2Events.forEach((eventName) => {
      this.socket?.on(eventName, (payload: any) => {
        console.log(`[Socket] ${eventName}:`, payload);
        const status = payload?.status || eventName.split('.')[1];
        if (status) {
          useOrderTrackingStore.getState().updateOrderStatus(status);
          const normalized = status.toLowerCase();
          const msg = statusMessages[normalized] || {
            title: 'Order Update 🔔',
            body: `Your order status has changed to ${status}`,
          };
          useNotificationStore.getState().showInAppNotification(msg.title, msg.body, 'order_status', {
            orderId: payload?.orderId,
          });
        }
      });
    });

    // 4. Live Rider GPS Location Updates
    this.socket.on('order:location_updated', (data: LocationUpdateEvent) => {
      useOrderTrackingStore.getState().updateRiderLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        updatedAt: data.timestamp,
      });
    });

    this.socket.on('delivery:location', (data: any) => {
      useOrderTrackingStore.getState().updateRiderLocation({
        latitude: data.lat || data.latitude,
        longitude: data.lng || data.longitude,
        heading: data.bearing || data.heading || 0,
        updatedAt: new Date().toISOString(),
      });
    });

    this.socket.on('delivery:assigned', (data: any) => {
      console.log('[Socket] Delivery assigned:', data);
      useNotificationStore.getState().showInAppNotification(
        'Rider Assigned 🛵',
        'A delivery partner has been assigned and is heading to the store.',
        'order_status',
        { orderId: data?.orderId }
      );
    });

    // 5. Broadcast & In-App Direct Notification Events
    this.socket.on('notification:new', (data: any) => {
      console.log('[Socket] New notification received:', data);
      useNotificationStore.getState().showInAppNotification(
        data?.title || 'New Notification 🔔',
        data?.body || 'You have received a new update.',
        data?.type || 'general',
        data?.data || {}
      );
    });

    this.socket.on('broadcast:received', (data: any) => {
      console.log('[Socket] Broadcast received:', data);
      useNotificationStore.getState().showInAppNotification(
        data?.title || 'Platform Announcement 📢',
        data?.body || '',
        'announcement',
        data
      );
    });

    return this.socket;
  }

  /**
   * Join specific order tracking room
   */
  joinOrderRoom(orderId: string) {
    this.currentOrderId = orderId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('order:join', { orderId });
      console.log(`[Socket] Joined order room: ${orderId}`);
    }
  }

  /**
   * Leave order tracking room
   */
  leaveOrderRoom(orderId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('order:leave', { orderId });
      console.log(`[Socket] Left order room: ${orderId}`);
    }
    if (this.currentOrderId === orderId) {
      this.currentOrderId = null;
    }
  }

  /**
   * Disconnect socket on app termination / logout
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentOrderId = null;
    }
  }
}

export const socketService = new SocketService();
