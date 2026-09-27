'use strict';

function registerOrderEvents(socket, io) {
  socket.on('order:subscribe', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('order:unsubscribe', (orderId) => {
    socket.leave(`order:${orderId}`);
  });
}

function emitOrderStatusChanged(userId, restaurantId, orderId, newStatus) {
  const io = require('../config/socket').getIO();
  const payload = { orderId, status: newStatus, timestamp: new Date().toISOString() };

  io.to(`user:${userId}`).emit('order:status_changed', payload);
  io.to(`restaurant:${restaurantId}`).emit('order:status_changed', payload);
  io.to(`order:${orderId}`).emit('order:status_changed', payload);
}

module.exports = { registerOrderEvents, emitOrderStatusChanged };
