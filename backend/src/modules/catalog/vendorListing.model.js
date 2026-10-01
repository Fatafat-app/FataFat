'use strict';

const mongoose = require('mongoose');
const { VERTICALS } = require('../../common/constants/orderStatuses');

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pricePaise: { type: Number, required: true },
    mrpPaise: { type: Number },
    stock: { type: Number, default: 0 },
  },
  { _id: true }
);

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pricePaise: { type: Number, required: true },
  },
  { _id: true }
);

const addonGroupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    minSelection: { type: Number, default: 0 },
    maxSelection: { type: Number, default: 1 },
    addons: [addonSchema],
  },
  { _id: true }
);

const vendorListingSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem', required: true, index: true },
    vertical: { type: String, enum: Object.values(VERTICALS), required: true, index: true },

    pricePaise: { type: Number, required: true }, // in integer paise (e.g. ₹150.00 = 15000)
    mrpPaise: { type: Number }, // in integer paise

    variants: [variantSchema],
    addonGroups: [addonGroupSchema],

    stock: {
      track: { type: Boolean, default: false }, // true for grocery SKUs, false for regular food dishes
      available: { type: Number, default: 0 },
      reserved: { type: Number, default: 0 },
      reorderLevel: { type: Number, default: 5 },
    },

    isAvailable: { type: Boolean, default: true, index: true },
    availableFrom: { type: String }, // e.g. "07:00"
    availableTo: { type: String },   // e.g. "11:00" for breakfast
    maxQtyPerOrder: { type: Number, default: 10 },
    sortOrder: { type: Number, default: 0 },

    lockedFields: [{ type: String }], // e.g. ['pricePaise'] when regulated by admin

    version: { type: Number, default: 1 }, // for optimistic concurrency checks
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

vendorListingSchema.index({ vendorId: 1, itemId: 1 }, { unique: true });
vendorListingSchema.index({ vendorId: 1, isAvailable: 1, vertical: 1 });
vendorListingSchema.index({ vertical: 1, isAvailable: 1 });

const VendorListing = mongoose.model('VendorListing', vendorListingSchema);
module.exports = VendorListing;
