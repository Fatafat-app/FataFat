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

  const redisOptions = {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password || undefined,
    maxRetriesPerRequest: 1, // Fail fast
    enableReadyCheck: false,
    connectTimeout: 2000,
    lazyConnect: true,
    retryStrategy() {
      return null; // Don't retry, just fail and use mock
    }
  };

  const client = new Redis(redisOptions);

  client.on('error', () => {
    // Suppress unhandled error events that crash the app when mock is used
  });

  client.connect().then(() => {
    logger.info('[Redis] Connected successfully');
    activeInstance = client;
    activeInstance._isMock = false;
  }).catch(() => {
    logger.warn('[Redis] Connection failed — continuing with in-memory mock');
  });

} catch (e) {
  logger.warn('[Redis] ioredis not found — using in-memory mock');
}

module.exports = redisProxy;
