'use strict';

/**
 * db.js — MongoDB connection management via Mongoose.
 *
 * - Connects once on startup, reuses the connection for the app lifetime.
 * - Logs connection state changes.
 * - `disconnect()` is called during graceful shutdown in server.js.
 */

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const MONGOOSE_OPTIONS = {
  // These are the recommended defaults for modern Mongoose
  serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unreachable
  socketTimeoutMS: 45000,
};

async function connect() {
  try {
    await mongoose.connect(env.db.uri, MONGOOSE_OPTIONS);
    logger.info('[DB] MongoDB connected', { uri: redactUri(env.db.uri) });
  } catch (err) {
    logger.error('[DB] Initial connection failed', { error: err.message });
    throw err; // Let server.js handle this — crash fast on startup failure
  }
}

async function disconnect() {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected');
}

// Log ongoing connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('[DB] MongoDB disconnected — attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('[DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('[DB] MongoDB connection error', { error: err.message });
});

/**
 * Redact credentials from connection URI for safe logging.
 * mongodb+srv://user:secret@host → mongodb+srv://***@host
 */
function redactUri(uri) {
  return uri.replace(/:\/\/[^@]+@/, '://***@');
}

module.exports = { connect, disconnect };
