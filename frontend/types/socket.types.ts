import { OrderStatus } from './order.types';

export interface LocationUpdateEvent {
  orderId: string;
  deliveryPartnerId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface StatusUpdateEvent {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  message?: string;
}

export interface SocketAuthPayload {
  token: string;
}
