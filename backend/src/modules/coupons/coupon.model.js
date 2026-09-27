'use strict';

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
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
