'use strict';

/**
 * logger.js — Application-wide Winston logger.
 *
 * - Development: colorized, human-readable console output
 * - Production:  structured JSON (for log aggregators like Datadog, ELK)
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Something broke', { error: err.message });
 */

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom format for development — easy to read in terminal
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${metaStr}${stack ? `\n${stack}` : ''}`;
  })
);

// Structured JSON for production — parsed by log aggregators
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  transports: [new transports.Console()],
  // Never crash the app on logger errors
  exitOnError: false,
});

module.exports = logger;
