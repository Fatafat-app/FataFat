'use strict';

const mongoose = require('mongoose');
const { VERTICAL_MODES } = require('../../common/constants/orderStatuses');

const featureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // e.g. 'vertical.food', 'vertical.grocery', 'vendor.64...accepting'
    scope: {
      level: {
        type: String,
        enum: ['global', 'city', 'zone', 'vendor'],
        default: 'global',
      },
      refId: { type: String }, // city name, zoneId, or vendorId
    },
    mode: {
      type: String,
      enum: Object.values(VERTICAL_MODES),
      default: VERTICAL_MODES.ON,
    },
    schedule: {
      from: { type: String }, // "00:00"
      to: { type: String },   // "06:00"
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    message: {
      title: { type: String, default: 'Service Temporarily Paused' },
      body: { type: String, default: 'We are currently paused in your area and will be back soon!' },
    },
    updatedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
    },
    reason: { type: String },
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

featureFlagSchema.index({ key: 1, 'scope.level': 1, 'scope.refId': 1 }, { unique: true });

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);
module.exports = FeatureFlag;
