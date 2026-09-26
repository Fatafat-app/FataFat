'use strict';

/**
 * couponExpiry.worker.js — Cron worker to deactivate expired coupons.
 * Runs every hour.
 */

const { Worker } = require('bullmq');
const { QueueScheduler, Queue } = require('bullmq');
const redis = require('../config/redis');
const couponService = require('../modules/coupons/coupon.service');
const logger = require('../config/logger');

// Cron job: runs every hour
const couponExpiryQueue = new Queue('coupon-expiry', { connection: redis });

// Schedule the recurring job (only adds if not already scheduled)
couponExpiryQueue.add(
  'deactivate-expired',
  {},
  { repeat: { pattern: '0 * * * *' }, jobId: 'coupon-expiry-cron' }
).catch((err) => logger.warn('[CouponWorker] Failed to schedule cron', { error: err.message }));

const worker = new Worker(
  'coupon-expiry',
  async (job) => {
    const deactivated = await couponService.deactivateExpiredCoupons();
    logger.info('[CouponWorker] Expired coupons deactivated', { count: deactivated });
  },
  { connection: redis }
);

worker.on('failed', (job, err) => {
  logger.error('[CouponWorker] Job failed', { error: err.message });
});

module.exports = worker;
