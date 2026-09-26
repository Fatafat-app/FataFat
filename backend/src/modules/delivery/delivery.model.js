'use strict';

/**
 * delivery.model.js — Delivery Partner / Rider profile and live state.
 */

const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    vehicle: {
      type: {
        type: String,
        enum: ['bike', 'scooter', 'cycle', 'car', 'electric_scooter'],
        default: 'bike',
      },
      model: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
    },
    documents: {
      drivingLicenseUrl: { type: String },
      nationalIdUrl: { type: String },
      vehicleInsuranceUrl: { type: String },
      isVerified: { type: Boolean, default: false },
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      updatedAt: { type: Date, default: Date.now },
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      average: { type: Number, default: 5.0, min: 1, max: 5 },
      count: { type: Number, default: 0 },
    },
    earnings: {
      total: { type: Number, default: 0 }, // in paise
      pendingPayout: { type: Number, default: 0 },
      today: { type: Number, default: 0 },
    },
    stats: {
      completedDeliveries: { type: Number, default: 0 },
      cancelledDeliveries: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for finding nearby riders
deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ isOnline: 1, isAvailable: 1 });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
