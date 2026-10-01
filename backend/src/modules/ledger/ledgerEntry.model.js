'use strict';

const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
  {
    account: { type: String, required: true }, // e.g. 'VENDOR_PAYABLE', 'PLATFORM_REVENUE', 'RIDER_CASH_HOLD'
    type: {
      type: String,
      enum: [
        'ORDER_REVENUE',
        'COMMISSION',
        'DELIVERY_FEE',
        'GST',
        'REFUND',
        'PAYOUT',
        'COD_COLLECTED',
      ],
      required: true,
    },
    debitPaise: { type: Number, default: 0 },
    creditPaise: { type: Number, default: 0 },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
  },
  {
    timestamps: { createdAt: 'at', updatedAt: false },
  }
);

ledgerEntrySchema.index({ vendorId: 1, at: -1 });
ledgerEntrySchema.index({ riderId: 1, at: -1 });
ledgerEntrySchema.index({ orderId: 1 });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
module.exports = LedgerEntry;
