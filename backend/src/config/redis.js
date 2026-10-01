'use strict';

const env = require('./env');
const logger = require('./logger');

// In-memory mock Redis for when Redis server is unavailable (local dev)
function createMockRedis() {
  const store = new Map();
  logger.warn('[Redis] Using in-memory mock (Redis server not available)');
  return {
    get: async (k) => store.get(k) ?? null,
    set: async (k, v, ...args) => { store.set(k, v); return 'OK'; },
    del: async (...keys) => { keys.forEach(k => store.delete(k)); return keys.length; },
    keys: async (pattern) => [...store.keys()].filter(k => k.includes(pattern.replace('*', ''))),
    expire: async () => 1,
    ttl: async () => -1,
    incr: async (k) => { const v = (Number(store.get(k)) || 0) + 1; store.set(k, String(v)); return v; },
    hset: async (k, ...args) => 1,
    hget: async () => null,
    hdel: async () => 1,
    hgetall: async () => null,
    lpush: async () => 1,
    lrange: async () => [],
    sadd: async () => 1,
    smembers: async () => [],
    on: () => {},
    once: () => {},
    emit: () => {},
    status: 'ready',
    disconnect: async () => {},
    quit: async () => 'OK',
    duplicate: function() { return this; },
    subscribe: async () => {},
    publish: async () => 0,
  };
}

let activeInstance = createMockRedis();
activeInstance._isMock = true;

const redisProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === '_isMock') return activeInstance._isMock;
    if (typeof activeInstance[prop] === 'function') {
      return activeInstance[prop].bind(activeInstance);
    }
    return activeInstance[prop];
  }
});

try {
  const Redis = require('ioredis');

  const redisConfig = env.redis.url || {
    host: env.redis.host,
    port: env.redis.port,
    username: 'default',
    password: env.redis.password || undefined,
  };

  const commonOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10000,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 3000);
    },
  };

  const client = typeof redisConfig === 'string'
    ? new Redis(redisConfig, commonOptions)
    : new Redis({ ...redisConfig, ...commonOptions });

  client.on('error', (err) => {
    logger.warn('[Redis] Connection warning:', { error: err.message });
  });

  client.connect().then(() => {
    logger.info('[Redis] Connected to Redis Cloud successfully 🚀');
    activeInstance = client;
    activeInstance._isMock = false;
  }).catch((err) => {
    logger.warn('[Redis] Initial connection failed — continuing with in-memory mock', { error: err.message });
  });

} catch (e) {
  logger.warn('[Redis] ioredis not found — using in-memory mock');
}

module.exports = redisProxy;
