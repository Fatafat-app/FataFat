'use strict';

const mongoose = require('mongoose');
const { VERTICALS } = require('../../common/constants/orderStatuses');

const catalogItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['dish', 'sku'], required: true, default: 'dish' },
    vertical: { type: String, enum: Object.values(VERTICALS), required: true, index: true },
    scope: { type: String, enum: ['vendor', 'master'], required: true, default: 'master' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // set when scope === 'vendor'

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    description: { type: String, default: '' },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    tags: [{ type: String }],
    searchTerms: [{ type: String }],

    attributes: {
      isVeg: { type: Boolean, default: true },
      spiceLevel: { type: String, enum: ['none', 'mild', 'medium', 'hot'], default: 'none' },
      unit: { type: String, default: 'piece' }, // 'kg', 'g', 'l', 'ml', 'pack', 'piece'
      unitSize: { type: Number, default: 1 },
      barcode: { type: String },
      shelfLifeDays: { type: Number },
    },

    tax: {
      hsn: { type: String },
      gstPercent: { type: Number, default: 5 }, // 0, 5, 12, 18
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
      index: true,
    },

    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
    },
    version: { type: Number, default: 1 },
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

catalogItemSchema.index({ vertical: 1, status: 1, categoryId: 1 });
catalogItemSchema.index({ vendorId: 1, status: 1 });
catalogItemSchema.index({ name: 'text', description: 'text', searchTerms: 'text' });

const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);
module.exports = CatalogItem;
