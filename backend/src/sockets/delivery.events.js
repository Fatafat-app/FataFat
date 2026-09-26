'use strict';

/**
 * delivery.events.js — Real-time delivery tracking events.
 *
 * Delivery partner emits location updates → forwarded to order room.
 * Clients (customer app) subscribe to order room to receive updates.
 *
 * Event: delivery:location_update
 *   Payload: { orderId, lat, lng, timestamp }
 */

/**
 * Register delivery-related socket event handlers.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerDeliveryEvents(socket, io) {
  // Delivery partner sends location updates
  socket.on('delivery:location_update', ({ orderId, lat, lng }) => {
    if (socket.user.role !== 'delivery_partner') return; // Ignore from non-partners

    io.to(`order:${orderId}`).emit('delivery:location_update', {
      orderId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
    });
  });
}

module.exports = { registerDeliveryEvents };
