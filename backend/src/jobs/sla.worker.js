'use strict';

const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../config/logger');
const Order = require('../modules/orders/order.model');
const { transition } = require('../modules/orders/order.stateMachine');
const { inventoryService } = require('../modules/inventory');
const { ORDER_STATUS } = require('../common/constants/orderStatuses');

let slaWorker = null;

if (!redis._isMock) {
  slaWorker = new Worker(
    'sla-timers',
    async (job) => {
      const { type, orderId } = job.data;
      const order = await Order.findById(orderId);
      if (!order) return;

      logger.info(`[SLA Worker] Processing SLA timer '${type}' for order ${orderId}`);

      if (type === 'ACCEPT_HARD_TIMEOUT') {
        // If still in PLACED after 3 minutes, auto-reject & release stock
        if (order.orderStatus === ORDER_STATUS.PLACED) {
          await transition(order, ORDER_STATUS.REJECTED, {
            actor: { role: 'system' },
            reason: 'Merchant acceptance SLA breached (3 min timeout)',
          });

          const items = order.items.map((i) => ({ listingId: i.listingId, quantity: i.quantity }));
          await inventoryService.releaseReservation(items, order._id, null, 'ORDER_RELEASED');
        }
      }
    },
    { connection: redis }
  );

  slaWorker.on('failed', (job, err) => {
    logger.error(`[SLA Worker] Job ${job?.id} failed: ${err.message}`);
  });
}

module.exports = slaWorker;
