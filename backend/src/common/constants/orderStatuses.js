'use strict';

const ORDER_STATUS = Object.freeze({
  // Legacy / Lowercase
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',

  // V2 Uppercase Constants
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
  FAILED_DELIVERY: 'FAILED_DELIVERY',
  EXPIRED: 'EXPIRED',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',

  // V2 Uppercase Constants
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUND_INITIATED: 'REFUND_INITIATED',
  COD_PENDING: 'COD_PENDING',
  COD_COLLECTED: 'COD_COLLECTED',
  SETTLED: 'SETTLED',
});

const DELIVERY_STATUS = Object.freeze({
  UNASSIGNED: 'UNASSIGNED',
  SEARCHING: 'SEARCHING',
  ASSIGNED: 'ASSIGNED',
  ARRIVED_PICKUP: 'ARRIVED_PICKUP',
  PICKED_UP: 'PICKED_UP',
  ARRIVED_DROP: 'ARRIVED_DROP',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  REASSIGNING: 'REASSIGNING',
});

const VERTICALS = Object.freeze({
  FOOD: 'food',
  GROCERY: 'grocery',
});

const VERTICAL_MODES = Object.freeze({
  ON: 'ON',
  DRAIN: 'DRAIN',
  OFF: 'OFF',
});

const VENDOR_TYPES = Object.freeze({
  RESTAURANT: 'restaurant',
  GROCERY_STORE: 'grocery_store',
  DARK_STORE: 'dark_store',
});

const VENDOR_OWNERSHIP = Object.freeze({
  MERCHANT: 'merchant',
  PLATFORM: 'platform',
});

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  VERTICALS,
  VERTICAL_MODES,
  VENDOR_TYPES,
  VENDOR_OWNERSHIP,
};
