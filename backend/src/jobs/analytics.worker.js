'use strict';

/**
 * analytics.worker.js — Processes analytics events asynchronously.
 * Updates restaurant-level stats off the request path.
 */

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const Restaurant = require('../modules/restaurants/restaurant.model');
const logger = require('../config/logger');

const worker = new Worker(
  'analytics',
  async (job) => {
    if (job.name === 'order-placed') {
      const { restaurantId, amount } = job.data;
      // Increment total orders and revenue for the restaurant
      await Restaurant.findByIdAndUpdate(restaurantId, {
        $inc: {
          'analytics.totalOrders': 1,
          'analytics.totalRevenue': amount,
        },
      });
      logger.debug('[AnalyticsWorker] Order analytics updated', { restaurantId });
    }
  },
  { connection: redis, concurrency: 20 }
);

worker.on('failed', (job, err) => {
  logger.error('[AnalyticsWorker] Job failed', { jobId: job.id, error: err.message });
});

module.exports = worker;
