'use strict';

/**
 * constants/orderStatuses.js — Order lifecycle statuses.
 *
 * Only the state machine (order.stateMachine.js) may enforce transitions.
 * No direct string comparisons elsewhere — always import from here.
 */

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',           // Order placed, awaiting restaurant confirmation
  CONFIRMED: 'confirmed',       // Restaurant accepted the order
  PREPARING: 'preparing',       // Restaurant is preparing the food
  READY_FOR_PICKUP: 'ready_for_pickup', // Food is ready, waiting for delivery partner
  OUT_FOR_DELIVERY: 'out_for_delivery', // Delivery partner picked up
  DELIVERED: 'delivered',       // Customer received the order
  CANCELLED: 'cancelled',       // Cancelled before preparation began
  REFUNDED: 'refunded',         // Cancelled after payment, refund issued
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

module.exports = { ORDER_STATUS, PAYMENT_STATUS };
