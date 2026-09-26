'use strict';

/**
 * review.model.js — Restaurant review schema.
 * One review per order — enforced by unique index.
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 1000 },
    images: [{ type: String }],
    isVisible: { type: Boolean, default: true }, // Admin can hide inappropriate reviews
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) { delete ret.__v; return ret; },
    },
  }
);

reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ order: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
