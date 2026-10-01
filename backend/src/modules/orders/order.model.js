'use strict';

const mongoose = require('mongoose');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  VERTICALS,
} = require('../../common/constants/orderStatuses');

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorListing' },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem' },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    unit: { type: String, default: 'piece' },
    pricePaise: { type: Number },
    price: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    totalPaise: { type: Number },
    totalPrice: { type: Number },
    taxPaise: { type: Number, default: 0 },
    variants: [{ name: String, pricePaise: Number }],
    addons: [{ name: String, pricePaise: Number }],
    selectedModifiers: [{ name: String, price: Number }],
    isUnavailable: { type: Boolean, default: false }, // marked true if short-picked in dark store
  },
  { _id: false, strict: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now },
    actor: {
      id: { type: mongoose.Schema.Types.Mixed },
      role: { type: String, default: 'system' },
    },
    reason: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    override: { type: Boolean, default: false },
  },
  { _id: false, strict: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      default: function () {
        return `FTF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      },
      index: true,
    },
    checkoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckoutSession' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    vertical: { type: String, default: 'food', index: true },
    orderType: { type: String, default: 'food' },
    subtotal: { type: Number },
    deliveryFee: { type: Number },
    taxAmount: { type: Number },
    discountAmount: { type: Number },
    totalAmount: { type: Number },

    items: {
      type: [orderItemSnapshotSchema],
      default: [],
    },

    deliveryAddress: {
      line1: { type: String, default: 'Main Address' },
      line2: String,
      city: { type: String, default: 'New Delhi' },
      state: { type: String, default: 'Delhi' },
      pincode: { type: String, default: '110001' },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },

    pricing: {
      itemsPaise: { type: Number, default: 0 },
      packagingPaise: { type: Number, default: 0 },
      deliveryPaise: { type: Number, default: 0 },
      taxPaise: { type: Number, default: 0 },
      discountPaise: { type: Number, default: 0 },
      tipPaise: { type: Number, default: 0 },
      totalPaise: { type: Number, default: 0 },
      vendorPayablePaise: { type: Number, default: 0 },
      commissionPaise: { type: Number, default: 0 },
    },

    // 1. Order Status Track
    orderStatus: {
      type: String,
      default: 'PLACED',
      index: true,
    },
    status: {
      type: String,
      default: 'PLACED',
    },

    // 2. Payment Status Track
    payment: {
      method: { type: String, default: 'COD' },
      status: {
        type: String,
        default: 'pending',
        index: true,
      },
      transactionId: { type: String },
      refundedPaise: { type: Number, default: 0 },
    },

    // 3. Delivery Status Track
    delivery: {
      status: {
        type: String,
        default: 'UNASSIGNED',
      },
      deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
      riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      deliveryOtp: { type: String }, // Hashed 4-digit OTP
      otpAttempts: { type: Number, default: 0 },
    },

    slaDeadlines: {
      acceptBy: { type: Date },
      packBy: { type: Date },
      handoverBy: { type: Date },
    },

    source: {
      type: String,
      default: 'customer_app',
    },
    createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    timeline: [timelineSchema],
    specialInstructions: { type: String, maxlength: 300 },
    version: { type: Number, default: 1 },
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

orderSchema.index({ vertical: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ vendorId: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ checkoutId: 1 });
orderSchema.index({ 'payment.status': 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
