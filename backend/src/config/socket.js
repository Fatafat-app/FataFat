'use strict';

/**
 * socket.js — Socket.IO server factory with Redis adapter.
 *
 * Redis adapter ensures events are broadcast across all Node instances
 * (horizontal scaling). The gateway (src/sockets/socket.gateway.js)
 * sets up auth and room logic.
 *
 * Usage (in server.js):
 *   const { initSocket, getIO } = require('./config/socket');
 *   const io = initSocket(httpServer);
 *
 * Usage (anywhere in the app):
 *   const { getIO } = require('./config/socket');
 *   getIO().to(roomId).emit('event', data);
 */

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let io = null;

/**
 * Initialises the Socket.IO server.
 * Must be called once in server.js after creating the HTTP server.
 */
function initSocket(httpServer) {
  const redisOptions = {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  // BullMQ / socket adapter need separate pub/sub clients
  const pubClient = new Redis(redisOptions);
  const subClient = pubClient.duplicate();

  io = new Server(httpServer, {
    cors: {
      origin: env.cors.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.adapter(createAdapter(pubClient, subClient));
  logger.info('[Socket.IO] Initialised with Redis adapter');

  return io;
}

/**
 * Returns the initialised Socket.IO instance.
 * Throws if called before initSocket().
 */
function getIO() {
  if (!io) {
    throw new Error('[Socket.IO] Not initialised. Call initSocket(httpServer) first.');
  }
  return io;
}

module.exports = { initSocket, getIO };
