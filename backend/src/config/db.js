'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
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
