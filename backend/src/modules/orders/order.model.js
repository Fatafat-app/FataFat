'use strict';

/**
 * order.model.js — Mongoose schema for orders.
 *
 * Items embed a price snapshot at time of order — never re-read from menu.
 * This ensures historical orders are correct even if menu prices change.
 * All monetary values in paise.
 */

const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },        // Snapshot: name at order time
    price: { type: Number, required: true },        // Snapshot: price in paise at order time
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },   // price * quantity (paise)
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, 'Order must have at least one item'] },

    deliveryAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number], // [lng, lat]
      },
    },

    // All monetary values in paise
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Final amount charged

    couponCode: { type: String },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    timeline: [timelineSchema],

    // Idempotency key to prevent duplicate order creation
    idempotencyKey: { type: String, unique: true, sparse: true },

    deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estimatedDeliveryMinutes: { type: Number },
    specialInstructions: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ idempotencyKey: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
