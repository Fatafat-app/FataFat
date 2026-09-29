'use strict';

const mongoose = require('mongoose');

const groceryBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: 120,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    bgGradient: {
      from: { type: String, default: '#2E7D32' },
      to: { type: String, default: '#1B5E20' },
    },
    linkType: {
      type: String,
      enum: ['category', 'product', 'deal', 'external', 'none'],
      default: 'none',
    },
    targetId: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

groceryBannerSchema.index({ isActive: 1, sortOrder: 1 });

const GroceryBanner = mongoose.model('GroceryBanner', groceryBannerSchema);
module.exports = GroceryBanner;
