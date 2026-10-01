'use strict';

const mongoose = require('mongoose');

const checkoutSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    addressSnapshot: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },
    zoneId: { type: String },

    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

    pricing: {
      itemsPaise: { type: Number, required: true },
      packagingPaise: { type: Number, default: 0 },
      deliveryPaise: { type: Number, default: 0 },
      taxPaise: { type: Number, default: 0 },
      discountPaise: { type: Number, default: 0 },
      tipPaise: { type: Number, default: 0 },
      totalPaise: { type: Number, required: true },
    },

    couponCode: { type: String },
    paymentMethod: { type: String, enum: ['ONLINE', 'COD'], default: 'ONLINE' },
    razorpayOrderId: { type: String },

    status: {
      type: String,
      enum: ['OPEN', 'PAYMENT_PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED'],
      default: 'PAYMENT_PENDING',
      index: true,
    },

    expiresAt: { type: Date, required: true, index: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
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

checkoutSessionSchema.index({ expiresAt: 1, status: 1 });

const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema);
module.exports = CheckoutSession;
