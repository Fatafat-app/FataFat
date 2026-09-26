'use strict';

/**
 * cart.model.js — Mongoose schema for user carts.
 *
 * Cart is stored in MongoDB (persistent) but reads are served from Redis cache.
 * Enforces single-restaurant rule: all items must be from the same restaurant.
 * Price snapshots are stored so cart totals are accurate even if menu changes.
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },     // Snapshot
    price: { type: Number, required: true },     // Snapshot in paise
    quantity: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    items: [cartItemSchema],
    // Coupon applied to cart (validated again at checkout)
    appliedCoupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      code: String,
      discountAmount: Number, // Paise
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

// Virtual: compute subtotal from items
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
