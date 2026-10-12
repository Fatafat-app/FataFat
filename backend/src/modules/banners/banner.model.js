'use strict';

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    displayMode: {
      type: String,
      enum: ['FULL_POSTER', 'CARD_TEMPLATE'],
      default: 'CARD_TEMPLATE',
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Promotion',
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'PROMO',
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    section: {
      type: String,
      enum: ['FOOD_HERO', 'OFFERS_FOR_YOU', 'SPOTLIGHT', 'GROCERY_HERO'],
      default: 'FOOD_HERO',
      index: true,
    },
    colors: {
      type: [String],
      default: ['#0D9488', '#0F766E'],
    },
    textColor: {
      type: String,
      default: '#FFFFFF',
    },
    accentColor: {
      type: String,
      default: '#CCFBF1',
    },
    actionText: {
      type: String,
      default: 'Order Now',
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['restaurant', 'category', 'cuisine', 'coupon', 'search', 'none'],
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
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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

bannerSchema.index({ section: 1, isActive: 1, sortOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;
