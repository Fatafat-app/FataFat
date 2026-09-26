'use strict';

const { Router } = require('express');
const controller = require('./payment.controller');
const webhookController = require('./webhook.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { paymentLimiter } = require('../../middlewares/rateLimiter.middleware');
const express = require('express');

const router = Router();

// Webhook MUST receive raw body — registered before JSON parser in app.js
// POST /api/v1/payments/webhook  (no auth — Razorpay calls this)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Override global JSON parser for this route
  (req, _res, next) => {
    // Store raw body string for signature verification
    req.rawBody = req.body.toString('utf8');
    req.body = JSON.parse(req.rawBody);
    next();
  },
  webhookController.handleWebhook
);

// Authenticated payment routes
router.use(authenticate);
router.post('/confirm', paymentLimiter, controller.confirmPayment);
router.get('/order/:orderId', controller.getPaymentForOrder);

module.exports = router;
