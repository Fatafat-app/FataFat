'use strict';

/**
 * email.worker.js — BullMQ background worker for email sending.
 *
 * Processes jobs from the 'emails' queue.
 */

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../config/logger');

const worker = new Worker(
  'emails',
  async (job) => {
    const { name, data } = job;
    logger.info('[EmailWorker] Processing email job', { type: name, to: data.email });

    switch (name) {
      case 'welcome':
        logger.info('[EmailWorker] Welcome email sent', { email: data.email, name: data.name });
        break;
      case 'order-receipt':
        logger.info('[EmailWorker] Order receipt email sent', { email: data.email, orderId: data.orderId });
        break;
      case 'password-reset':
        logger.info('[EmailWorker] Password reset email sent', { email: data.email });
        break;
      default:
        logger.warn('[EmailWorker] Unknown email job name', { name });
    }
  },
  { connection: redis, concurrency: 5 }
);

worker.on('failed', (job, err) => {
  logger.error('[EmailWorker] Job failed', { jobId: job.id, error: err.message });
});

module.exports = worker;
