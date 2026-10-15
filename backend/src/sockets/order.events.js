'use strict';

function registerOrderEvents(socket, io) {
  socket.on('order:subscribe', (orderId) => {
    if (orderId) socket.join(`order:${orderId}`);
  });

  socket.on('order:join', (data) => {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (orderId) socket.join(`order:${orderId}`);
  });

  socket.on('order:unsubscribe', (orderId) => {
    if (orderId) socket.leave(`order:${orderId}`);
  });

  socket.on('order:leave', (data) => {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (orderId) socket.leave(`order:${orderId}`);
  });

  socket.on('restaurant:join', (data) => {
    const restaurantId = typeof data === 'string' ? data : data?.restaurantId;
    if (restaurantId) socket.join(`restaurant:${restaurantId}`);
  });

  socket.on('restaurant:leave', (data) => {
    const restaurantId = typeof data === 'string' ? data : data?.restaurantId;
    if (restaurantId) socket.leave(`restaurant:${restaurantId}`);
  });
}

function emitOrderStatusChanged(userId, restaurantId, orderId, newStatus) {
  const io = require('../config/socket').getIO();
  const payload = { orderId, status: newStatus, timestamp: new Date().toISOString() };

  io.to(`user:${userId}`).emit('order:status_changed', payload);
  if (restaurantId) {
    io.to(`restaurant:${restaurantId}`).emit('order:status_changed', payload);
  }
  io.to(`order:${orderId}`).emit('order:status_changed', payload);
}

module.exports = { registerOrderEvents, emitOrderStatusChanged };
