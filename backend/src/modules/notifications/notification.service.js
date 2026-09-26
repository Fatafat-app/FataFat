'use strict';

/**
 * notification.service.js — Notification orchestration and persistence.
 *
 * Services call this to enqueue notifications.
 * Workers (src/jobs/notification.worker.js) handle actual delivery.
 * In-app notifications are persisted to DB for the user's notification feed.
 */

const { notificationQueue, emailQueue, smsQueue } = require('../../config/queue');
const Notification = require('./notification.model');
const User = require('../users/user.model');
const logger = require('../../config/logger');

/**
 * Enqueue an order status notification for a user and save to in-app notification feed.
 */
async function notifyOrderStatusChange(userId, orderId, newStatus) {
  const messages = {
    confirmed: 'Your order has been confirmed by the restaurant 🎉',
    preparing: 'The restaurant is preparing your food 👨‍🍳',
    ready_for_pickup: 'Your order is ready for pickup 📦',
    out_for_delivery: 'Your order is on the way! 🛵',
    delivered: 'Your order has been delivered. Enjoy! 🍽️',
    cancelled: 'Your order has been cancelled ❌',
  };

  const body = messages[newStatus] || `Order status updated to: ${newStatus}`;

  // Persist in-app notification
  try {
    await Notification.create({
      user: userId,
      title: 'Order Update',
      body,
      type: 'order_status',
      data: { orderId: String(orderId), status: newStatus },
    });
  } catch (err) {
    logger.error('[NotificationService] Failed to persist order notification', { error: err.message });
  }

  // Enqueue push notification
  await notificationQueue.add('order-status', {
    userId,
    orderId,
    newStatus,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Enqueue a payment success notification.
 */
async function notifyPaymentSuccess(userId, orderId, amount) {
  const formattedAmount = (amount / 100).toFixed(2);
  try {
    await Notification.create({
      user: userId,
      title: 'Payment Successful ✅',
      body: `Your payment of ₹${formattedAmount} was successful.`,
      type: 'payment',
      data: { orderId: String(orderId), amount: String(amount) },
    });
  } catch (err) {
    logger.error('[NotificationService] Failed to persist payment notification', { error: err.message });
  }

  await notificationQueue.add('payment-success', {
    userId,
    orderId,
    amount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Enqueue a welcome email after registration.
 */
async function sendWelcomeEmail(userId, email, name) {
  await emailQueue.add('welcome', { userId, email, name });
}

/**
 * Enqueue an OTP SMS.
 */
async function sendOtpSms(phone, otp) {
  await smsQueue.add('otp', { phone, otp });
}

/**
 * Get in-app notifications for a user with pagination.
 */
async function getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      unreadCount,
    },
  };
}

/**
 * Mark a single notification or all user notifications as read.
 */
async function markAsRead(userId, notificationId = null) {
  if (notificationId) {
    await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead: true });
  } else {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }
  return { success: true };
}

/**
 * Register or update device FCM token for user.
 */
async function updateDeviceToken(userId, fcmToken) {
  await User.findByIdAndUpdate(userId, { fcmToken });
  return { success: true };
}

module.exports = {
  notifyOrderStatusChange,
  notifyPaymentSuccess,
  sendWelcomeEmail,
  sendOtpSms,
  getUserNotifications,
  markAsRead,
  updateDeviceToken,
};
