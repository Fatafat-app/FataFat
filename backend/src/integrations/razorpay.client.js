'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const { PaymentError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  try {
    const order = await razorpay.orders.create({ amount, currency, receipt, notes });
    return order;
  } catch (err) {
    throw new PaymentError(`Failed to create payment order: ${err.message}`, ERROR_CODES.PAYMENT_FAILED);
  }
}

function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );

  if (!isValid) {
    throw new PaymentError('Payment signature verification failed', ERROR_CODES.INVALID_SIGNATURE);
  }

  return true;
}

function verifyWebhookSignature(rawBody, receivedSig) {
  const expectedSig = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSig, 'hex'),
    Buffer.from(receivedSig, 'hex')
  );

  if (!isValid) {
    throw new PaymentError('Webhook signature verification failed', ERROR_CODES.INVALID_SIGNATURE);
  }

  return true;
}

async function createRefund(paymentId, amount = null) {
  try {
    const options = amount ? { amount } : {};
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (err) {
    throw new PaymentError(`Refund failed: ${err.message}`, ERROR_CODES.PAYMENT_FAILED);
  }
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature, createRefund };
