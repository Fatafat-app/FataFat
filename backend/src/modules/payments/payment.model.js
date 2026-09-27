'use strict';

const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../../common/constants/orderStatuses');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    idempotencyKey: { type: String, unique: true },

    razorpayRefundId: { type: String },
    refundAmount: { type: Number },
    refundedAt: { type: Date },

    webhookEvents: [
      {
        event: String,
        receivedAt: { type: Date, default: Date.now },
        payload: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
