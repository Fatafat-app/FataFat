'use strict';

const mongoose = require('mongoose');

const groceryCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    emoji: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    bg: {
      type: String,
      default: '#FFFFFF',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    badge: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    badgeType: {
      type: String,
      enum: ['lime', 'grey', 'pink', 'blue', 'default'],
      default: 'default',
    },
    itemCount: {
      type: String,
      trim: true,
      default: '50+ items',
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

groceryCategorySchema.index({ slug: 1 }, { unique: true });
groceryCategorySchema.index({ isActive: 1, sortOrder: 1 });

const GroceryCategory = mongoose.model('GroceryCategory', groceryCategorySchema);
module.exports = GroceryCategory;
