'use strict';

/**
 * rateLimiter.middleware.js — Redis-backed rate limiting.
 *
 * Multiple limiters for different sensitivity levels:
 *   - globalLimiter:   broad protection for all routes
 *   - authLimiter:     tight limit on /auth/* (login, register)
 *   - otpLimiter:      very tight limit on OTP send/verify
 *   - paymentLimiter:  prevents double-submission on payment endpoints
 */

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const ERROR_CODES = require('../common/constants/errorCodes');

/**
 * Factory: create a rate limiter with a Redis store.
 * @param {object} options - express-rate-limit options
 */
function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,   // Send RateLimit-* headers
    legacyHeaders: false,     // Disable X-RateLimit-* legacy headers
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${options.keyPrefix || 'global'}:`,
    }),
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests. Please try again later.',
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      });
    },
    keyGenerator: options.keyGenerator,
    validate: false,
    skip: options.skip,
  });
}

// 100 requests per 15 minutes per IP — applied to all routes
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'global',
  message: 'Too many requests from this IP. Please try again in 15 minutes.',
});

// 10 auth attempts per 15 minutes per IP
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

// 5 OTP requests per 10 minutes per phone number
const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'otp',
  message: 'Too many OTP requests for this number. Please wait 10 minutes.',
  // Keyed by phone from req.body instead of IP
  keyGenerator: (req) => req.body?.phone || req.ip,
});

// 5 payment attempts per 10 minutes per user
const paymentLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'payment',
  message: 'Too many payment attempts. Please try again in 10 minutes.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { globalLimiter, authLimiter, otpLimiter, paymentLimiter };
