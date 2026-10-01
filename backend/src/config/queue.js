'use strict';

const redis = require('./redis');
const logger = require('./logger');

// No-op mock queue for when Redis is unavailable
function createMockQueue(name) {
  return {
    name,
    add: async () => ({ id: 'mock' }),
    addBulk: async () => [],
    getJobs: async () => [],
    close: async () => {},
    on: () => {},
    once: () => {},
    emit: () => {},
  };
}

let notificationQueue, emailQueue, smsQueue, analyticsQueue, couponExpiryQueue, payoutQueue, slaQueue, refundQueue;

if (redis._isMock) {
  logger.warn('[Queues] Redis unavailable — using no-op mock queues');
  notificationQueue = createMockQueue('notifications');
  emailQueue = createMockQueue('emails');
  smsQueue = createMockQueue('sms');
  analyticsQueue = createMockQueue('analytics');
  couponExpiryQueue = createMockQueue('coupon-expiry');
  payoutQueue = createMockQueue('payouts');
  slaQueue = createMockQueue('sla-timers');
  refundQueue = createMockQueue('refunds');
} else {
  const { Queue } = require('bullmq');
  const QUEUE_DEFAULTS = {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  };

  notificationQueue = new Queue('notifications', QUEUE_DEFAULTS);
  emailQueue = new Queue('emails', QUEUE_DEFAULTS);
  smsQueue = new Queue('sms', QUEUE_DEFAULTS);
  analyticsQueue = new Queue('analytics', QUEUE_DEFAULTS);
  couponExpiryQueue = new Queue('coupon-expiry', QUEUE_DEFAULTS);
  payoutQueue = new Queue('payouts', QUEUE_DEFAULTS);
  slaQueue = new Queue('sla-timers', QUEUE_DEFAULTS);
  refundQueue = new Queue('refunds', QUEUE_DEFAULTS);

  const queues = [
    notificationQueue,
    emailQueue,
    smsQueue,
    analyticsQueue,
    couponExpiryQueue,
    payoutQueue,
    slaQueue,
    refundQueue,
  ];
  queues.forEach((q) => {
    q.on('error', (err) => logger.error(`[Queue:${q.name}] Error`, { error: err.message }));
  });
}

async function closeAllQueues() {
  await Promise.all([
    notificationQueue,
    emailQueue,
    smsQueue,
    analyticsQueue,
    couponExpiryQueue,
    payoutQueue,
    slaQueue,
    refundQueue,
  ].map((q) => q.close()));
  logger.info('[Queues] All queues closed');
}

module.exports = {
  notificationQueue,
  emailQueue,
  smsQueue,
  analyticsQueue,
  couponExpiryQueue,
  payoutQueue,
  slaQueue,
  refundQueue,
  closeAllQueues,
};
