'use strict';

/**
 * order.events.js — Real-time order event handlers.
 *
 * Server emits:
 *   order:status_changed  → to user's personal room + restaurant room
 *
 * How to emit from services (without a socket reference):
 *   const { getIO } = require('../config/socket');
 *   getIO().to(`user:${userId}`).emit('order:status_changed', payload);
 */

/**
 * Register order-related socket event listeners for a connected client.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerOrderEvents(socket, io) {
  // Client can subscribe to a specific order's updates
  socket.on('order:subscribe', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('order:unsubscribe', (orderId) => {
    socket.leave(`order:${orderId}`);
  });
}

/**
 * Emit order status change to all relevant parties.
 * Called from order.service.js after state machine transition.
 *
 * @param {string} userId
 * @param {string} restaurantId
 * @param {string} orderId
 * @param {string} newStatus
 */
function emitOrderStatusChanged(userId, restaurantId, orderId, newStatus) {
  const io = require('../config/socket').getIO();
  const payload = { orderId, status: newStatus, timestamp: new Date().toISOString() };

  // Emit to customer
  io.to(`user:${userId}`).emit('order:status_changed', payload);
  // Emit to restaurant
  io.to(`restaurant:${restaurantId}`).emit('order:status_changed', payload);
  // Emit to order room (delivery partner tracking)
  io.to(`order:${orderId}`).emit('order:status_changed', payload);
}

module.exports = { registerOrderEvents, emitOrderStatusChanged };
