'use strict';

const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
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
