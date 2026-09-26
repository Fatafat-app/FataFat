'use strict';

/**
 * webhook.controller.js — Razorpay webhook handler.
 *
 * This is the SOURCE OF TRUTH for payment state changes.
 * Client-reported success is a UI convenience — this is what we trust.
 *
 * IMPORTANT: This route must receive the RAW body (unparsed JSON string)
 * for signature verification. Express must NOT parse JSON before this handler.
 * See app.js for the raw body parser on this route.
 */

const Payment = require('./payment.model');
const Order = require('../orders/order.model');
const razorpayClient = require('../../integrations/razorpay.client');
const { notificationQueue } = require('../../config/queue');
const { PAYMENT_STATUS } = require('../../common/constants/orderStatuses');
const { success, error } = require('../../common/response/apiResponse');
const logger = require('../../config/logger');

/**
 * Handles all Razorpay webhook events.
 * Always returns 200 to Razorpay (prevents retries on our errors).
 */
async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  // Verify webhook signature using raw body
  try {
    razorpayClient.verifyWebhookSignature(req.rawBody, signature);
  } catch (err) {
    logger.warn('[Webhook] Signature verification failed', { error: err.message });
    // Return 200 to prevent Razorpay from logging errors, but don't process
    return res.status(200).json({ success: false, message: 'Signature mismatch' });
  }

  const event = req.body;
  const eventType = event.event;
  const payload = event.payload?.payment?.entity || event.payload?.order?.entity;

  logger.info('[Webhook] Received event', { type: eventType, paymentId: payload?.id });

  try {
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload, event);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload, event);
        break;
      case 'refund.created':
        await handleRefundCreated(event.payload?.refund?.entity, event);
        break;
      default:
        logger.debug('[Webhook] Unhandled event type', { type: eventType });
    }
  } catch (err) {
    // Log error but still return 200 to prevent Razorpay retries
    logger.error('[Webhook] Processing error', { eventType, error: err.message });
  }

  // Always acknowledge receipt to Razorpay
  return success(res, null, 'Webhook received');
}

async function handlePaymentCaptured(paymentEntity, rawEvent) {
  const razorpayOrderId = paymentEntity.order_id;

  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    logger.warn('[Webhook] Payment record not found', { razorpayOrderId });
    return;
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    logger.info('[Webhook] Payment already processed (idempotent)', { razorpayOrderId });
    return;
  }

  // Update payment record
  payment.razorpayPaymentId = paymentEntity.id;
  payment.status = PAYMENT_STATUS.PAID;
  payment.webhookEvents.push({ event: 'payment.captured', payload: paymentEntity });
  await payment.save();

  // Update order payment status
  const order = await Order.findByIdAndUpdate(
    payment.order,
    { paymentStatus: PAYMENT_STATUS.PAID },
    { new: true }
  );

  // Notify user
  if (order) {
    notificationQueue.add('payment-success', {
      userId: order.user.toString(),
      orderId: order._id.toString(),
      amount: payment.amount,
    }).catch(() => {});
  }

  logger.info('[Webhook] Payment captured processed', { orderId: payment.order });
}

async function handlePaymentFailed(paymentEntity, rawEvent) {
  const razorpayOrderId = paymentEntity.order_id;
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) return;

  payment.status = PAYMENT_STATUS.FAILED;
  payment.webhookEvents.push({ event: 'payment.failed', payload: paymentEntity });
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.FAILED });

  logger.info('[Webhook] Payment failed processed', { orderId: payment.order });
}

async function handleRefundCreated(refundEntity, rawEvent) {
  if (!refundEntity) return;
  const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
  if (!payment) return;

  payment.razorpayRefundId = refundEntity.id;
  payment.refundAmount = refundEntity.amount;
  payment.status = PAYMENT_STATUS.REFUNDED;
  payment.refundedAt = new Date();
  payment.webhookEvents.push({ event: 'refund.created', payload: refundEntity });
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, { paymentStatus: PAYMENT_STATUS.REFUNDED });

  logger.info('[Webhook] Refund processed', { orderId: payment.order });
}

module.exports = { handleWebhook };
