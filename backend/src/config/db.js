const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // safe fallback
}

const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  autoIndex: true,
};

async function connect() {
  try {
    await mongoose.connect(env.db.uri, MONGOOSE_OPTIONS);
    logger.info('[DB] MongoDB connected', { uri: redactUri(env.db.uri) });
  } catch (err) {
    logger.error('[DB] Initial connection failed', { error: err.message });
    throw err;
  }
}

async function disconnect() {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected');
}

mongoose.connection.on('disconnected', () => {
  logger.warn('[DB] MongoDB disconnected — attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('[DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('[DB] MongoDB connection error', { error: err.message });
});

function redactUri(uri) {
  return uri.replace(/:\/\/[^@]+@/, '://***@');
}

module.exports = { connect, disconnect };
