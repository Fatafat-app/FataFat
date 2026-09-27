'use strict';

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

router.post('/register', authLimiter, validate(registerSchema), controller.register);

router.post('/login', authLimiter, validate(loginSchema), controller.login);

router.post('/otp/send', otpLimiter, validate(sendOtpSchema), controller.sendOtp);
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), controller.sendOtp);

router.post('/otp/verify', otpLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), controller.verifyOtp);

router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/refresh-token', validate(refreshTokenSchema), controller.refresh);

router.post('/logout', authenticate, controller.logout);

module.exports = router;
