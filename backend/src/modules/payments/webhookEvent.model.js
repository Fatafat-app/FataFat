'use strict';

const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true }, // e.g. razorpay event id
    provider: { type: String, default: 'razorpay' },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['PROCESSED', 'FAILED', 'IGNORED'],
      default: 'PROCESSED',
    },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ eventId: 1 }, { unique: true });
webhookEventSchema.index({ createdAt: -1 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
module.exports = WebhookEvent;
