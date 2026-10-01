'use strict';

const mongoose = require('mongoose');
const { VERTICALS } = require('../../common/constants/orderStatuses');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    vertical: {
      type: String,
      enum: [...Object.values(VERTICALS), 'both'],
      default: 'both',
      index: true,
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    iconUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
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

categorySchema.index({ vertical: 1, isActive: 1, sortOrder: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;
