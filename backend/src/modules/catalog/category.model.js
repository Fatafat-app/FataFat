'use strict';

const mongoose = require('mongoose');
const { VERTICALS } = require('../../common/constants/orderStatuses');

const categorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    vertical: {
      type: String,
      enum: [...Object.values(VERTICALS), 'both'],
      default: 'both',
      index: true,
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    iconUrl: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' }, // Dual compatibility with admin screens
    description: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    order: { type: Number, default: 0 }, // Dual compatibility with admin reorder
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        // Keep image and iconUrl in sync in response
        if (!ret.image && ret.iconUrl) ret.image = ret.iconUrl;
        if (!ret.iconUrl && ret.image) ret.iconUrl = ret.image;
        if (ret.order === undefined && ret.sortOrder !== undefined) ret.order = ret.sortOrder;
        if (ret.sortOrder === undefined && ret.order !== undefined) ret.sortOrder = ret.order;
        return ret;
      },
    },
  }
);

categorySchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!this.code && this.name) {
    this.code = this.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  }
  if (!this.iconUrl && this.image) {
    this.iconUrl = this.image;
  } else if (!this.image && this.iconUrl) {
    this.image = this.iconUrl;
  }
  if (this.order !== undefined && this.sortOrder === 0) {
    this.sortOrder = this.order;
  } else if (this.sortOrder !== undefined && this.order === 0) {
    this.order = this.sortOrder;
  }
});

categorySchema.index({ vertical: 1, isActive: 1, sortOrder: 1 });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;
