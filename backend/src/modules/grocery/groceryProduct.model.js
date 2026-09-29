'use strict';

const mongoose = require('mongoose');

const groceryProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroceryCategory',
      required: [true, 'Product category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit / packaging is required'],
      trim: true,
      maxlength: 50,
    },
    images: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      enum: ['deal', 'best_seller', 'organic', null],
      default: null,
    },
    discount: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 100,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isOrganic: {
      type: Boolean,
      default: false,
    },
    isSpecialDeal: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    weightInfo: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    estimatedDelivery: {
      type: String,
      trim: true,
      default: 'Today 5–6PM',
    },
    highlights: [
      {
        label: { type: String, trim: true },
        type: { type: String, enum: ['lime', 'blue', 'grey', 'pink', 'default'], default: 'default' },
        icon: { type: String, trim: true },
      },
    ],
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

groceryProductSchema.index({ slug: 1 }, { unique: true });
groceryProductSchema.index({ category: 1, isAvailable: 1, isActive: 1 });
groceryProductSchema.index({ isSpecialDeal: 1, isAvailable: 1, isActive: 1 });
groceryProductSchema.index({ isTrending: 1, isAvailable: 1, isActive: 1 });
groceryProductSchema.index({ isOrganic: 1, isAvailable: 1, isActive: 1 });
groceryProductSchema.index({ price: 1 });
groceryProductSchema.index({ rating: -1 });
groceryProductSchema.index({ name: 'text', tags: 'text', description: 'text' });

const GroceryProduct = mongoose.model('GroceryProduct', groceryProductSchema);
module.exports = GroceryProduct;
