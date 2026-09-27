'use strict';

const { Queue } = require('bullmq');
const redis = require('./redis');
const logger = require('./logger');

const QUEUE_DEFAULTS = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

const notificationQueue = new Queue('notifications', QUEUE_DEFAULTS);
const emailQueue = new Queue('emails', QUEUE_DEFAULTS);
const smsQueue = new Queue('sms', QUEUE_DEFAULTS);
const analyticsQueue = new Queue('analytics', QUEUE_DEFAULTS);
const couponExpiryQueue = new Queue('coupon-expiry', QUEUE_DEFAULTS);
const payoutQueue = new Queue('payouts', QUEUE_DEFAULTS);

const queues = [notificationQueue, emailQueue, smsQueue, analyticsQueue, couponExpiryQueue, payoutQueue];
queues.forEach((q) => {
  q.on('error', (err) => logger.error(`[Queue:${q.name}] Error`, { error: err.message }));
});

async function closeAllQueues() {
  await Promise.all(queues.map((q) => q.close()));
  logger.info('[Queues] All queues closed');
}

module.exports = {
  notificationQueue,
  emailQueue,
  smsQueue,
  analyticsQueue,
  couponExpiryQueue,
  payoutQueue,
  closeAllQueues,
};
