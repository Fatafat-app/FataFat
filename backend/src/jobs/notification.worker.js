'use strict';

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { sendPushNotification } = require('../integrations/firebase.client');
const { sendPushToUser } = require('../integrations/onesignal.client');
const User = require('../modules/users/user.model');
const logger = require('../config/logger');

const notificationTemplates = {
  'order-status': ({ newStatus, orderId }) => ({
    title: `Order Update`,
    body: statusToMessage(newStatus),
    data: { orderId, type: 'order_status' },
  }),
  'payment-success': ({ amount, orderId }) => ({
    title: 'Payment Successful ✅',
    body: `Your payment of ₹${(amount / 100).toFixed(2)} was successful`,
    data: { orderId, type: 'payment' },
  }),
};

function statusToMessage(status) {
  const messages = {
    confirmed: 'Your order has been confirmed by the restaurant 🎉',
    preparing: 'The restaurant is preparing your food 👨‍🍳',
    ready_for_pickup: 'Your order is ready for pickup 📦',
    out_for_delivery: 'Your order is on the way! 🛵',
    delivered: 'Your order has been delivered. Enjoy! 🍽️',
    cancelled: 'Your order has been cancelled',
  };
  return messages[status] || `Order status updated to: ${status}`;
}

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId } = job.data;
    const template = notificationTemplates[job.name];

    if (!template) {
      logger.warn('[NotificationWorker] Unknown job type', { name: job.name });
      return;
    }

    const { title, body, data } = template(job.data);
    let sentViaOneSignal = false;

    // 1. Send via OneSignal using external_id (matches oneSignalService.login on mobile)
    try {
      await sendPushToUser(userId, { title, body, data });
      sentViaOneSignal = true;
      logger.info('[NotificationWorker] OneSignal push sent successfully', { userId, jobName: job.name });
    } catch (onesignalErr) {
      logger.warn('[NotificationWorker] OneSignal push error', { userId, error: onesignalErr.message });
    }

    // 2. Also try FCM if user has registered FCM device token
    try {
      const user = await User.findById(userId).select('+fcmToken');
      if (user?.fcmToken) {
        await sendPushNotification(user.fcmToken, { title, body, data });
        logger.info('[NotificationWorker] FCM push sent', { userId, jobName: job.name });
      } else if (!sentViaOneSignal) {
        logger.debug('[NotificationWorker] User has no FCM token and OneSignal did not deliver', { userId });
      }
    } catch (fcmErr) {
      logger.warn('[NotificationWorker] FCM push failed', { userId, error: fcmErr.message });
    }
  },
  { connection: redis, concurrency: 10 }
);

worker.on('failed', (job, err) => {
  logger.error('[NotificationWorker] Job failed', { jobId: job.id, error: err.message });
});

module.exports = worker;
