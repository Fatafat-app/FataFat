'use strict';

/**
 * requestLogger.middleware.js — HTTP request/response logging.
 *
 * Uses Morgan with a custom token that feeds into Winston.
 * Skips logging for health-check endpoints to reduce noise.
 */

const morgan = require('morgan');
const logger = require('../config/logger');

// Custom Morgan token for request ID (set by upstream proxy or generated)
morgan.token('req-id', (req) => req.headers['x-request-id'] || '-');

// Stream Morgan output through Winston
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

const SKIP_PATHS = ['/health', '/ping'];

const requestLogger = morgan(
  ':req-id :method :url :status :res[content-length] - :response-time ms',
  {
    stream: morganStream,
    skip: (req) => SKIP_PATHS.includes(req.path),
  }
);

module.exports = requestLogger;
