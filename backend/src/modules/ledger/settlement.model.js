'use strict';

const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    windowStart: { type: Date, required: true },
    windowEnd: { type: Date, required: true },
    grossSalesPaise: { type: Number, required: true },
    commissionPaise: { type: Number, required: true },
    refundsPaise: { type: Number, default: 0 },
    netPayablePaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'PAID'],
      default: 'DRAFT',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    payoutTransactionId: { type: String },
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ vendorId: 1, windowEnd: -1 });

const Settlement = mongoose.model('Settlement', settlementSchema);
module.exports = Settlement;
