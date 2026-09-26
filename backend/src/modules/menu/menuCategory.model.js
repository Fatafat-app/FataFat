'use strict';

/**
 * menuCategory.model.js — Menu category schema.
 * Each restaurant has multiple categories (e.g. Starters, Main Course).
 */

const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

menuCategorySchema.index({ restaurant: 1, sortOrder: 1 });

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
module.exports = MenuCategory;
