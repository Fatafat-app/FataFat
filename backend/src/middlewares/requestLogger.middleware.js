'use strict';

const morgan = require('morgan');
const logger = require('../config/logger');

morgan.token('req-id', (req) => req.headers['x-request-id'] || '-');

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
