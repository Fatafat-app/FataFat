'use strict';

/**
 * menuItem.model.js — Individual menu item schema.
 * Price is stored in paise (smallest INR unit) — never rupees with decimals.
 */

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: 150,
    },
    description: { type: String, trim: true, maxlength: 500 },
    // Price in paise (100 paise = ₹1). Never store as float.
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer (in paise)',
      },
    },
    images: [{ type: String }], // Cloudinary URLs
    isVeg: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    // Nutritional info (optional)
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
