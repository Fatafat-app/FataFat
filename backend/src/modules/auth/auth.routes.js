'use strict';

/**
 * auth.routes.js — Auth module routes.
 *
 * Middleware chain per route:
 *   validate → [rateLimiter] → controller
 *
 * No auth middleware on these routes (they ARE the auth routes).
 * Logout requires auth (you need a valid token to log out).
 */

const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { authLimiter, otpLimiter } = require('../../middlewares/rateLimiter.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} = require('./auth.validation');

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerSchema), controller.register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), controller.login);

// POST /api/v1/auth/otp/send & /send-otp
router.post('/otp/send', otpLimiter, validate(sendOtpSchema), controller.sendOtp);
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), controller.sendOtp);

// POST /api/v1/auth/otp/verify & /verify-otp
router.post('/otp/verify', otpLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), controller.verifyOtp);

// POST /api/v1/auth/refresh & /refresh-token
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/refresh-token', validate(refreshTokenSchema), controller.refresh);

// POST /api/v1/auth/logout  (requires valid access token)
router.post('/logout', authenticate, controller.logout);

module.exports = router;
