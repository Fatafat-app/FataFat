'use strict';

const { Worker, Queue } = require('bullmq');
const redis = require('../config/redis');
const DeliveryPartner = require('../modules/delivery/delivery.model');
const Restaurant = require('../modules/restaurants/restaurant.model');
const Order = require('../modules/orders/order.model');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../common/constants/orderStatuses');
const logger = require('../config/logger');

const payoutQueue = new Queue('payouts', { connection: redis });

payoutQueue
  .add(
    'reconcile-daily-payouts',
    {},
    { repeat: { pattern: '0 2 * * *' }, jobId: 'payout-reconcile-daily' }
  )
  .catch((err) => logger.warn('[PayoutWorker] Failed to schedule cron', { error: err.message }));

const worker = new Worker(
  'payouts',
  async (job) => {
    logger.info('[PayoutWorker] Starting daily payout reconciliation...');

    try {
      const riders = await DeliveryPartner.find({ 'earnings.today': { $gt: 0 } });
      for (const rider of riders) {
        rider.earnings.today = 0;
        await rider.save();
      }

      logger.info('[PayoutWorker] Reconciled riders daily balances', { count: riders.length });
    } catch (err) {
      logger.error('[PayoutWorker] Reconciliation failed', { error: err.message });
      throw err;
    }
  },
  { connection: redis }
);

worker.on('failed', (job, err) => {
  logger.error('[PayoutWorker] Job failed', { jobId: job.id, error: err.message });
});

module.exports = worker;
