'use strict';

/**
 * sms.worker.js — BullMQ background worker for SMS & OTP delivery.
 *
 * Processes jobs from the 'sms' queue.
 */

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../config/logger');

const worker = new Worker(
  'sms',
  async (job) => {
    const { name, data } = job;
    logger.info('[SMSWorker] Processing SMS job', { type: name, phone: data.phone });

    switch (name) {
      case 'otp':
        // Integration point for Fast2SMS / Twilio / Kaleyra
        logger.info(`[SMSWorker] OTP sent to ${data.phone}: [${data.otp}]`);
        break;
      case 'order-alert':
        logger.info(`[SMSWorker] Alert SMS sent to ${data.phone}: ${data.message}`);
        break;
      default:
        logger.warn('[SMSWorker] Unknown SMS job type', { name });
    }
  },
  { connection: redis, concurrency: 10 }
);

worker.on('failed', (job, err) => {
  logger.error('[SMSWorker] Job failed', { jobId: job.id, error: err.message });
});

module.exports = worker;
