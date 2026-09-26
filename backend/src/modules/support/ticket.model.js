'use strict';

/**
 * ticket.model.js — Customer support ticket schema.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [{ type: String }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['order_issue', 'payment_issue', 'delivery_delay', 'food_quality', 'account', 'other'],
      default: 'order_issue',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    messages: [messageSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', ticketSchema);
