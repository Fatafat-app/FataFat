'use strict';

const Payment = require('./payment.model');
const Order = require('../orders/order.model');
const razorpayClient = require('../../integrations/razorpay.client');
const { NotFoundError, PaymentError, ConflictError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { PAYMENT_STATUS } = require('../../common/constants/orderStatuses');

async function confirmPayment({ razorpayOrderId, razorpayPaymentId, signature }, userId) {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw new NotFoundError('Payment record not found');

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new ConflictError('Payment already confirmed', ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
  }

  razorpayClient.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature });

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.PAID });

  return payment;
}

async function getPaymentByOrder(orderId) {
  const payment = await Payment.findOne({ order: orderId });
  if (!payment) throw new NotFoundError('Payment not found for this order');
  return payment;
}

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
