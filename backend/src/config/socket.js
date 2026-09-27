'use strict';

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let io = null;

function initSocket(httpServer) {
  const redisOptions = {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

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

function getIO() {
  if (!io) {
    throw new Error('[Socket.IO] Not initialised. Call initSocket(httpServer) first.');
  }
  return io;
}

module.exports = { initSocket, getIO };
