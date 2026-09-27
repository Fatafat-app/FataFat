'use strict';

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: { type: String, trim: true, maxlength: 500 },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'],
    },
    email: { type: String, trim: true, lowercase: true },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v) => v.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    cuisines: [{ type: String, trim: true }],
    images: [{ type: String }],
    coverImage: { type: String },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    deliveryInfo: {
      minOrderAmount: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      estimatedMinutes: { type: Number, default: 30 },
      radiusKm: { type: Number, default: 5 },
    },
    timings: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
    },
    isOpen: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 20 },
    taxPercent: { type: Number, default: 5 },
    fssaiLicense: { type: String, trim: true },
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

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isActive: 1, isOpen: 1 });
restaurantSchema.index({ cuisines: 1 });
restaurantSchema.index({ name: 'text', description: 'text', cuisines: 'text' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
