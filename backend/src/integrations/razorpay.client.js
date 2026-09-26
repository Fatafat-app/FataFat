'use strict';

/**
 * razorpay.client.js — Razorpay SDK wrapper.
 *
 * All Razorpay operations go through this module.
 * No other file imports the Razorpay SDK directly.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const { PaymentError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

/**
 * Create a Razorpay order.
 * Amount must be in smallest currency unit (paise for INR).
 *
 * @param {{ amount: number, currency: string, receipt: string, notes?: object }} options
 * @returns {Promise<object>} Razorpay order object
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  try {
    const order = await razorpay.orders.create({ amount, currency, receipt, notes });
    return order;
  } catch (err) {
    throw new PaymentError(`Failed to create payment order: ${err.message}`, ERROR_CODES.PAYMENT_FAILED);
  }
}

/**
 * Verify Razorpay payment signature.
 * Returns true if valid, throws PaymentError if tampered.
 *
 * @param {{ razorpayOrderId: string, razorpayPaymentId: string, signature: string }}
 */
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

/**
 * Verify Razorpay webhook signature.
 * Uses the webhook secret (different from payment secret).
 *
 * @param {string} rawBody      - Raw request body string (unparsed)
 * @param {string} receivedSig  - X-Razorpay-Signature header value
 */
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

/**
 * Initiate a refund for a payment.
 *
 * @param {string} paymentId  - Razorpay payment ID
 * @param {number} [amount]   - Amount to refund in paise (null = full refund)
 * @returns {Promise<object>} Razorpay refund object
 */
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
