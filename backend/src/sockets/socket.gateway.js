'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getIO } = require('../config/socket');
const logger = require('../config/logger');

const { registerOrderEvents } = require('./order.events');
const { registerDeliveryEvents } = require('./delivery.events');

function initGateway() {
  const io = getIO();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    logger.debug('[Socket] Client connected', { userId, socketId: socket.id });

    socket.join(`user:${userId}`);
    if (role) {
      socket.join(`role:${role}`);
    }

    if (role === 'restaurant_owner' && socket.handshake.auth?.restaurantId) {
      socket.join(`restaurant:${socket.handshake.auth.restaurantId}`);
      logger.debug('[Socket] Restaurant owner joined room', {
        userId,
        restaurantId: socket.handshake.auth.restaurantId,
      });
    }

    registerOrderEvents(socket, io);
    registerDeliveryEvents(socket, io);

    socket.on('disconnect', (reason) => {
      logger.debug('[Socket] Client disconnected', { userId, reason });
    });
  });
}

module.exports = { initGateway };
