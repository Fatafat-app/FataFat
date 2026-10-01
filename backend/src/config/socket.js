'use strict';

const { Server } = require('socket.io');
const env = require('./env');
const logger = require('./logger');
const redisConfig = require('./redis');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.cors.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  if (!redisConfig._isMock) {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const Redis = require('ioredis');
      const redisOptions = env.redis.url || {
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null,
      };
      const pubClient = typeof redisOptions === 'string' ? new Redis(redisOptions) : new Redis(redisOptions);
      const subClient = pubClient.duplicate();
      
      pubClient.on('error', () => {});
      subClient.on('error', () => {});

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('[Socket.IO] Initialised with Redis Cloud adapter 🚀');
    } catch (e) {
      logger.warn('[Socket.IO] Redis adapter failed, falling back to memory adapter');
    }
  } else {
    logger.info('[Socket.IO] Initialised with default memory adapter (Redis unavailable)');
  }

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('[Socket.IO] Not initialised. Call initSocket(httpServer) first.');
  }
  return io;
}

module.exports = { initSocket, getIO };
