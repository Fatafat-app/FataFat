'use strict';

const Outbox = require('./outbox.model');
const logger = require('../../config/logger');
const { getIO } = require('../../config/socket');
const { notificationQueue } = require('../../config/queue');

class OutboxService {
  /**
   * Save event within an ongoing MongoDB transaction/session
   */
  async record({ eventName, aggregateType, aggregateId, payload }, session = null) {
    const doc = new Outbox({
      eventName,
      aggregateType,
      aggregateId: String(aggregateId),
      payload,
    });

    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }

    // Trigger asynchronous dispatch after write
    setImmediate(() => {
      this.dispatchSingle(doc._id).catch((err) => {
        logger.error('[Outbox] Failed immediate dispatch', { id: doc._id, err: err.message });
      });
    });

    return doc;
  }

  /**
   * Dispatches a single outbox event
   */
  async dispatchSingle(outboxId) {
    const entry = await Outbox.findById(outboxId);
    if (!entry || entry.status === 'PROCESSED') return;

    try {
      const { eventName, payload } = entry;

      // 1. Send to Notification BullMQ Queue for push/SMS processing
      await notificationQueue.add(eventName, {
        eventName,
        aggregateType: entry.aggregateType,
        aggregateId: entry.aggregateId,
        payload,
      });

      // 2. Broadcast via Socket.IO if available
      try {
        const io = getIO();
        if (io) {
          this.broadcastSocketEvent(io, eventName, payload);
        }
      } catch {
        // Socket may not be initialized in worker/script contexts
      }

      entry.status = 'PROCESSED';
      entry.processedAt = new Date();
      await entry.save();
    } catch (err) {
      entry.attempts += 1;
      entry.lastError = err.message;
      if (entry.attempts >= 5) {
        entry.status = 'FAILED';
      }
      await entry.save();
      throw err;
    }
  }

  /**
   * Socket room fan-out according to Section 6.2 & Section 8 of V2 Architecture
   */
  broadcastSocketEvent(io, eventName, payload) {
    const { orderId, vendorId, customerId, riderId, vertical } = payload;

    // Direct room emissions
    if (orderId) io.to(`order:${orderId}`).emit(eventName, payload);
    if (customerId) io.to(`user:${customerId}`).emit(eventName, payload);
    if (vendorId) io.to(`vendor:${vendorId}`).emit(eventName, payload);
    if (riderId) io.to(`rider:${riderId}`).emit(eventName, payload);

    // Admin operational boards
    io.to('admin:orders').emit(eventName, payload);
    if (vertical) {
      io.to(`admin:vertical:${vertical}`).emit(eventName, payload);
    }
  }

  /**
   * Relay batch processor for unprocessed outbox records
   */
  async processPendingBatch(limit = 50) {
    const pending = await Outbox.find({ status: 'PENDING', attempts: { $lt: 5 } })
      .sort({ createdAt: 1 })
      .limit(limit);

    for (const item of pending) {
      try {
        await this.dispatchSingle(item._id);
      } catch (err) {
        logger.error('[Outbox Relay] Error processing item', { id: item._id, err: err.message });
      }
    }
  }
}

module.exports = new OutboxService();
