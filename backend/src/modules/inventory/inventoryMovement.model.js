'use strict';

const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorListing', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    delta: { type: Number, required: true }, // positive (restock/release) or negative (reserve/short)
    reason: {
      type: String,
      enum: [
        'ORDER_RESERVED',
        'ORDER_COMMITTED',
        'ORDER_RELEASED',
        'ADMIN_SET',
        'MERCHANT_SET',
        'PICK_SHORT',
        'RESTOCK',
        'EXPIRY',
      ],
      required: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
    },
    snapshot: {
      availableBefore: Number,
      availableAfter: Number,
      reservedBefore: Number,
      reservedAfter: Number,
    },
  },
  {
    timestamps: { createdAt: 'at', updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

inventoryMovementSchema.index({ listingId: 1, at: -1 });
inventoryMovementSchema.index({ vendorId: 1, at: -1 });
inventoryMovementSchema.index({ orderId: 1 });

const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
module.exports = InventoryMovement;
