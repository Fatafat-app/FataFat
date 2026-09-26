'use strict';

/**
 * auditLog.model.js — Admin audit trail.
 *
 * Records every privileged administrative action for compliance and security.
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: true, // e.g., 'User', 'Restaurant', 'Order', 'Coupon'
      trim: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
