'use strict';

/**
 * socket.gateway.js — Socket.IO connection handling and auth.
 *
 * Authenticates WebSocket connections using the JWT access token
 * passed in the handshake auth object.
 *
 * After auth, clients join their personal room (userId) and
 * any restaurant room they manage.
 *
 * Usage (client):
 *   const socket = io('http://localhost:3000', {
 *     auth: { token: 'Bearer <accessToken>' }
 *   });
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getIO } = require('../config/socket');
const logger = require('../config/logger');

// Import event handlers
const { registerOrderEvents } = require('./order.events');
const { registerDeliveryEvents } = require('./delivery.events');

function initGateway() {
  const io = getIO();

  // Auth middleware for all socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      socket.user = decoded; // Attach decoded user to socket
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    logger.debug('[Socket] Client connected', { userId, socketId: socket.id });

    // Join personal room — receives order notifications for this user
    socket.join(`user:${userId}`);

    // Restaurant owners join their restaurant room
    if (role === 'restaurant_owner' && socket.handshake.auth?.restaurantId) {
      socket.join(`restaurant:${socket.handshake.auth.restaurantId}`);
      logger.debug('[Socket] Restaurant owner joined room', {
        userId,
        restaurantId: socket.handshake.auth.restaurantId,
      });
    }

    // Register domain-specific event handlers
    registerOrderEvents(socket, io);
    registerDeliveryEvents(socket, io);

    socket.on('disconnect', (reason) => {
      logger.debug('[Socket] Client disconnected', { userId, reason });
    });
  });
}

module.exports = { initGateway };
