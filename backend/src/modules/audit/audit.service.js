'use strict';

const AuditLog = require('./audit.model');
const logger = require('../../config/logger');

class AuditService {
  /**
   * Records an immutable audit log entry
   */
  async log({ actor, action, entity, before = null, after = null, reason = null, requestId = null }, session = null) {
    try {
      const entry = new AuditLog({
        actor: {
          id: actor?.id || actor?._id || null,
          role: actor?.role || 'system',
          ip: actor?.ip || null,
          userAgent: actor?.userAgent || null,
        },
        action,
        entity: {
          type: entity.type,
          id: String(entity.id),
        },
        before,
        after,
        reason,
        requestId,
      });

      if (session) {
        await entry.save({ session });
      } else {
        await entry.save();
      }

      return entry;
    } catch (err) {
      logger.error('Failed to write audit log entry', { err: err.message, action, entity });
      // We don't fail user requests if audit write fails in standalone mode, but log it strictly
      return null;
    }
  }

  async getLogs({ entityType, entityId, actorId, action, page = 1, limit = 50 }) {
    const filter = {};
    if (entityType) filter['entity.type'] = entityType;
    if (entityId) filter['entity.id'] = entityId;
    if (actorId) filter['actor.id'] = actorId;
    if (action) filter.action = action;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new AuditService();
