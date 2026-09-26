import { Address } from './user.types';
import { MenuItemModifierOption } from './menu.types';
import { Restaurant } from './restaurant.types';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'ONLINE' | 'COD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number; // in paise
  selectedModifiers?: MenuItemModifierOption[];
  totalItemPrice: number; // in paise
}

export interface OrderPricing {
  itemsTotal: number;       // in paise
  deliveryFee: number;      // in paise
  gstAndTaxes: number;      // in paise
  platformFee: number;      // in paise
  discount: number;         // in paise
  totalAmount: number;      // in paise (final payable)
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string | Restaurant;
  deliveryPartnerId?: {
    _id: string;
    name: string;
    phone: string;
    avatar?: string;
    vehicleDetails?: {
      model: string;
      plateNumber: string;
    };
  };
  items: OrderItem[];
  pricing: OrderPricing;
  deliveryAddress: Address;
  deliveryInstructions?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  timeline: OrderTimeline[];
  estimatedDeliveryTime?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  menuItemId: string;
  quantity: number;
  selectedModifiers?: MenuItemModifierOption[];
}

export interface CreateOrderPayload {
  restaurantId: string;
  items: CreateOrderItemPayload[];
  deliveryAddress: Address;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface EstimateOrderPayload {
  restaurantId: string;
  items: CreateOrderItemPayload[];
  deliveryAddressId?: string;
  couponCode?: string;
}

export interface EstimateOrderResponse {
  pricing: OrderPricing;
  estimatedDeliveryMinutes: number;
}
