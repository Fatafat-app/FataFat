'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, default: 'admin' },
      ip: { type: String },
      userAgent: { type: String },
    },
    action: { type: String, required: true },
    resource: { type: String },
    resourceId: { type: String },
    entity: {
      type: { type: String, default: 'General' },
      id: { type: String, default: 'SYSTEM' },
    },
    changes: { type: mongoose.Schema.Types.Mixed },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    requestId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: 'at', updatedAt: false },
    strict: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ 'entity.type': 1, 'entity.id': 1, at: -1 });
auditLogSchema.index({ 'actor.id': 1, at: -1 });
auditLogSchema.index({ admin: 1, at: -1 });
auditLogSchema.index({ action: 1, at: -1 });
auditLogSchema.index({ at: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
