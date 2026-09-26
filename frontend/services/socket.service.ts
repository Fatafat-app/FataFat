import { io, Socket } from 'socket.io-client';
import { getAccessToken, getSocketUrl } from './api';
import { useOrderTrackingStore } from '../store/orderTracking.store';
import { LocationUpdateEvent, StatusUpdateEvent } from '../types';

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

    // Listen to real-time status update events
    this.socket.on('order:status_updated', (data: StatusUpdateEvent) => {
      console.log('[Socket] Order status updated:', data);
      useOrderTrackingStore.getState().updateOrderStatus(data.status);
    });

    // Listen to real-time rider location updates
    this.socket.on('order:location_updated', (data: LocationUpdateEvent) => {
      console.log('[Socket] Rider location updated:', data);
      useOrderTrackingStore.getState().updateRiderLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        updatedAt: data.timestamp,
      });
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
