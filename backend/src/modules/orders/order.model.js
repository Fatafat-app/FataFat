'use strict';

const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
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
        coordinates: [Number],
      },
    },

    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

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
