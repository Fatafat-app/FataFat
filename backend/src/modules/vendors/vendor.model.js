'use strict';

const mongoose = require('mongoose');
const { VENDOR_TYPES, VENDOR_OWNERSHIP, VERTICALS } = require('../../common/constants/orderStatuses');

const vendorStaffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['manager', 'picker', 'cashier'], default: 'manager' },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: Object.values(VENDOR_TYPES),
      required: true,
      default: VENDOR_TYPES.RESTAURANT,
    },
    vertical: {
      type: String,
      enum: Object.values(VERTICALS),
      required: true,
      index: true,
    },
    ownership: {
      type: String,
      enum: Object.values(VENDOR_OWNERSHIP),
      default: VENDOR_OWNERSHIP.MERCHANT,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staff: [vendorStaffSchema],

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    zoneIds: [{ type: String }],
    serviceRadiusM: { type: Number, default: 5000 },

    images: {
      logo: { type: String },
      banner: { type: String },
    },

    hours: [
      {
        day: { type: Number, min: 0, max: 6 }, // 0 = Sunday
        open: { type: String, default: '09:00' },
        close: { type: String, default: '23:00' },
        isClosed: { type: Boolean, default: false },
      },
    ],

    isOpen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    pausedUntil: { type: Date },
    pauseReason: { type: String },

    approval: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
      kybDocs: [{ title: String, url: String }],
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
    },

    commission: {
      percent: { type: Number, default: 15 },
      flatPaise: { type: Number, default: 0 },
    },

    prepTime: {
      avgMin: { type: Number, default: 20 },
      p90Min: { type: Number, default: 35 },
    },

    autoAccept: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 4.5, min: 1, max: 5 },
    ratingCount: { type: Number, default: 0 },
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

vendorSchema.index({ location: '2dsphere' });
vendorSchema.index({ vertical: 1, isActive: 1, isOpen: 1 });
vendorSchema.index({ ownerId: 1 });
vendorSchema.index({ 'staff.userId': 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
