'use strict';

const Payment = require('./payment.model');
const WebhookEvent = require('./webhookEvent.model');
const Refund = require('./refund.model');
const CheckoutSession = require('../checkout/checkoutSession.model');
const Order = require('../orders/order.model');
const { transition } = require('../orders/order.stateMachine');
const { inventoryService } = require('../inventory');
const razorpayClient = require('../../integrations/razorpay.client');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');
const { BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');

class PaymentService {
  /**
   * Process Razorpay Webhook Event with deduplication and state machine transition
   */
  async processWebhookEvent({ eventId, eventType, payload, signatureHeader, rawBody }) {
    // 1. Check if event was already processed (deduplication)
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) {
      logger.info('[Payment Webhook] Duplicate event ignored', { eventId, eventType });
      return { status: 'DUPLICATE_IGNORED' };
    }

    // 2. Verify signature
    const isValid = razorpayClient.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      logger.error('[Payment Webhook] Invalid webhook signature', { eventId });
      throw new BusinessError('Invalid webhook signature', ERROR_CODES.INVALID_SIGNATURE, 400);
    }

    const webhookRecord = new WebhookEvent({
      eventId,
      eventType,
      payload,
      status: 'PROCESSED',
    });

    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = payload.payment?.entity || payload.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const transactionId = paymentEntity?.id;

        // Locate CheckoutSession by razorpayOrderId
        const session = await CheckoutSession.findOne({ razorpayOrderId }).populate('orders');
        if (session && session.status !== 'PAID') {
          session.status = 'PAID';
          await session.save();

          // Transition each order to PLACED
          for (const order of session.orders) {
            if (order.orderStatus === ORDER_STATUS.PAYMENT_PENDING) {
              order.payment.status = PAYMENT_STATUS.PAID;
              order.payment.transactionId = transactionId;
              await transition(order, ORDER_STATUS.PLACED, {
                actor: { role: 'webhook' },
                reason: 'Razorpay payment captured',
                meta: { transactionId, razorpayOrderId },
              });

              // Commit reserved stock
              const items = order.items.map((i) => ({ listingId: i.listingId, quantity: i.quantity }));
              await inventoryService.commitReservation(items, order._id);
            }
          }
        }
      }

      await webhookRecord.save();
      return { status: 'PROCESSED' };
    } catch (err) {
      webhookRecord.status = 'FAILED';
      webhookRecord.error = err.message;
      await webhookRecord.save();
      throw err;
    }
  }

  /**
   * Issue a full or partial refund
   */
  async processRefund({ orderId, amountPaise, reason, actor }) {
    const order = await Order.findById(orderId);
    if (!order) throw new BusinessError('Order not found', ERROR_CODES.NOT_FOUND);

    const refund = new Refund({
      orderId: order._id,
      amountPaise,
      reason,
      initiatedBy: { id: actor.id, role: actor.role },
      status: 'PROCESSED',
    });

    order.payment.refundedPaise = (order.payment.refundedPaise || 0) + amountPaise;
    if (order.payment.refundedPaise >= order.pricing.totalPaise) {
      order.payment.status = PAYMENT_STATUS.REFUNDED;
    } else {
      order.payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
    }

    await Promise.all([refund.save(), order.save()]);
    return refund;
  }
}

module.exports = new PaymentService();
