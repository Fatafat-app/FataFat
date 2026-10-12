'use strict';

const mongoose = require('mongoose');
const { createMasterSchema } = require('./master.schema');

const cancellationReasonSchema = createMasterSchema({
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'rider', 'admin', 'all'],
    required: [true, 'Role context is required (customer, restaurant, rider, admin, or all)'],
    index: true,
  },
  requiresRemarks: {
    type: Boolean,
    default: false,
  },
  triggersAutoRefund: {
    type: Boolean,
    default: false,
  },
});

cancellationReasonSchema.index({ role: 1, isActive: 1, sortOrder: 1 });

const CancellationReason =
  mongoose.models.CancellationReason || mongoose.model('CancellationReason', cancellationReasonSchema);
module.exports = CancellationReason;
