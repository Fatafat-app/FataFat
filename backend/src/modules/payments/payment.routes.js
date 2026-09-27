'use strict';

const { Router } = require('express');
const controller = require('./payment.controller');
const webhookController = require('./webhook.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { paymentLimiter } = require('../../middlewares/rateLimiter.middleware');
const express = require('express');

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    req.rawBody = req.body.toString('utf8');
    req.body = JSON.parse(req.rawBody);
    next();
  },
  webhookController.handleWebhook
);

router.use(authenticate);
router.post('/confirm', paymentLimiter, controller.confirmPayment);
router.get('/order/:orderId', controller.getPaymentForOrder);

module.exports = router;
