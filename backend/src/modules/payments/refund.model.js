'use strict';

const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    amountPaise: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    razorpayRefundId: { type: String },
    initiatedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, default: 'system' },
    },
    approvedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

refundSchema.index({ orderId: 1, createdAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
