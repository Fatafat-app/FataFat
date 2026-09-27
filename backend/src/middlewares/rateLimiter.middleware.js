'use strict';

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const ERROR_CODES = require('../common/constants/errorCodes');

function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
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

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'global',
  message: 'Too many requests from this IP. Please try again in 15 minutes.',
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'otp',
  message: 'Too many OTP requests for this number. Please wait 10 minutes.',
  keyGenerator: (req) => req.body?.phone || req.ip,
});

const paymentLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'payment',
  message: 'Too many payment attempts. Please try again in 10 minutes.',
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { globalLimiter, authLimiter, otpLimiter, paymentLimiter };
