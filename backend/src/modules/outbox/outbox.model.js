'use strict';

const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true }, // e.g. 'order.placed.v1', 'delivery.assigned.v1'
    aggregateType: { type: String, required: true }, // e.g. 'Order', 'Vendor', 'Listing'
    aggregateId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

outboxSchema.index({ status: 1, createdAt: 1 });
outboxSchema.index({ aggregateType: 1, aggregateId: 1 });

const Outbox = mongoose.model('Outbox', outboxSchema);
module.exports = Outbox;
