'use strict';

/**
 * payment.service.js — Payment business logic.
 *
 * Handles payment initiation (creates Razorpay order + Payment record)
 * and payment confirmation (client-side verify after user pays).
 * Webhook is the authoritative source — handled in webhook.controller.js.
 */

const Payment = require('./payment.model');
const Order = require('../orders/order.model');
const razorpayClient = require('../../integrations/razorpay.client');
const { NotFoundError, PaymentError, ConflictError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { PAYMENT_STATUS } = require('../../common/constants/orderStatuses');

/**
 * Confirm a payment on the client side.
 * Verifies Razorpay signature — sets paymentStatus to 'paid' on success.
 *
 * NOTE: This is a secondary check. The webhook (webhook.controller.js)
 * is the source of truth. We also verify here for instant UI feedback.
 *
 * @param {{ razorpayOrderId, razorpayPaymentId, signature }} verifyData
 * @param {string} userId
 */
async function confirmPayment({ razorpayOrderId, razorpayPaymentId, signature }, userId) {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw new NotFoundError('Payment record not found');

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new ConflictError('Payment already confirmed', ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
  }

  // Verify signature — throws PaymentError if invalid
  razorpayClient.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature });

  // Update payment record
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  // Update order payment status
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.PAID });

  return payment;
}

/**
 * Get payment details for an order.
 * @param {string} orderId
 */
async function getPaymentByOrder(orderId) {
  const payment = await Payment.findOne({ order: orderId });
  if (!payment) throw new NotFoundError('Payment not found for this order');
  return payment;
}

/**
 * Process a refund for an order.
 * @param {string} orderId
 * @param {number} [amount] - Paise. If null, full refund.
 */
async function processRefund(orderId, amount = null) {
  const payment = await Payment.findOne({ order: orderId });
  if (!payment) throw new NotFoundError('Payment not found');

  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw new PaymentError('Can only refund paid payments', ERROR_CODES.PAYMENT_FAILED);
  }

  const refund = await razorpayClient.createRefund(payment.razorpayPaymentId, amount);

  payment.status = PAYMENT_STATUS.REFUNDED;
  payment.razorpayRefundId = refund.id;
  payment.refundAmount = amount || payment.amount;
  payment.refundedAt = new Date();
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.REFUNDED });

  return payment;
}

module.exports = { confirmPayment, getPaymentByOrder, processRefund };
