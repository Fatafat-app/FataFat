'use strict';

const mongoose = require('mongoose');

const customFeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 }, // in paise
    isEnabled: { type: Boolean, default: true },
    description: { type: String },
  },
  { _id: true }
);

const feeConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'GLOBAL_FEES', unique: true },
    platformFee: { type: Number, default: 500, min: 0 }, // in paise (500 = ₹5)
    platformFeeEnabled: { type: Boolean, default: true },

    taxPercent: { type: Number, default: 5, min: 0, max: 100 }, // in percent (5 = 5%)
    taxEnabled: { type: Boolean, default: true },

    baseDeliveryFee: { type: Number, default: 3000, min: 0 }, // in paise (3000 = ₹30)
    deliveryFeeEnabled: { type: Boolean, default: true },

    packagingFee: { type: Number, default: 1000, min: 0 }, // in paise (1000 = ₹10)
    packagingFeeEnabled: { type: Boolean, default: false },

    surgeFee: { type: Number, default: 0, min: 0 }, // in paise (0 = ₹0)
    surgeFeeEnabled: { type: Boolean, default: false },

    customFees: [customFeeSchema],

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FeeConfig', feeConfigSchema);
