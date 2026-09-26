'use strict';

/**
 * coupon.model.js — Coupon/promo code schema.
 * All monetary values in paise.
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true }, // Percent (0-100) or flat paise amount
    minOrderAmount: { type: Number, default: 0 }, // Paise — min cart value to apply
    maxDiscount: { type: Number }, // Paise — cap for percent discounts
    usageLimit: { type: Number }, // Total uses allowed (null = unlimited)
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    // Track which users used this coupon (for perUserLimit)
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }, // null = global
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; delete ret.usedBy; return ret; },
    },
  }
);

couponSchema.index({ expiresAt: 1 });
couponSchema.index({ isActive: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
