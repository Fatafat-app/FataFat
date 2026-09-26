'use strict';

/**
 * redis.js — ioredis client singleton.
 *
 * Exports a single Redis client that is shared across the entire app.
 * Rate limiters, OTP storage, caching, and BullMQ all use this connection.
 *
 * Usage:
 *   const redis = require('./redis');
 *   await redis.set('key', 'value', 'EX', 300);
 *   const val = await redis.get('key');
 */

const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`[Redis] Retrying connection, attempt ${times}, delay ${delay}ms`);
    return delay;
  },
};

const redis = new Redis(redisOptions);

redis.on('connect', () => logger.info('[Redis] Connected'));
redis.on('ready', () => logger.info('[Redis] Ready'));
redis.on('error', (err) => logger.error('[Redis] Error', { error: err.message }));
redis.on('close', () => logger.warn('[Redis] Connection closed'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));

module.exports = redis;
