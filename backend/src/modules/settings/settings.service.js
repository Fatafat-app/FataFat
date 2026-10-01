'use strict';

const FeatureFlag = require('./featureFlag.model');
const redis = require('../../config/redis');
const logger = require('../../config/logger');
const auditService = require('../audit');
const outboxService = require('../outbox');
const { VERTICALS, VERTICAL_MODES } = require('../../common/constants/orderStatuses');

const CACHE_KEY_BOOTSTRAP = 'settings:bootstrap';
const CACHE_TTL_SECONDS = 60;

class SettingsService {
  /**
   * Determine effective availability of vertical considering global, zone, vendor and schedule
   */
  async isVerticalAvailable(vertical, { zoneId = null, vendorId = null, now = new Date() } = {}) {
    const key = `vertical.${vertical}`;

    // 1. Fetch flags (global, zone, vendor)
    const flags = await FeatureFlag.find({
      key,
      $or: [
        { 'scope.level': 'global' },
        ...(zoneId ? [{ 'scope.level': 'zone', 'scope.refId': String(zoneId) }] : []),
        ...(vendorId ? [{ 'scope.level': 'vendor', 'scope.refId': String(vendorId) }] : []),
      ],
    }).lean();

    const globalFlag = flags.find((f) => f.scope.level === 'global');
    const zoneFlag = zoneId ? flags.find((f) => f.scope.level === 'zone') : null;
    const vendorFlag = vendorId ? flags.find((f) => f.scope.level === 'vendor') : null;

    // Check most restrictive
    const activeFlags = [vendorFlag, zoneFlag, globalFlag].filter(Boolean);

    for (const flag of activeFlags) {
      if (flag.mode === VERTICAL_MODES.OFF) {
        return {
          available: false,
          mode: VERTICAL_MODES.OFF,
          message: flag.message || { title: 'Vertical Unavailable', body: `${vertical} is currently unavailable.` },
        };
      }
      if (flag.mode === VERTICAL_MODES.DRAIN) {
        return {
          available: false,
          mode: VERTICAL_MODES.DRAIN,
          message: flag.message || { title: 'Orders Paused', body: `${vertical} is paused for new orders right now.` },
        };
      }
    }

    return { available: true, mode: VERTICAL_MODES.ON, message: null };
  }

  /**
   * Returns bootstrap configuration for client applications
   */
  async getBootstrapConfig() {
    try {
      const cached = await redis.get(CACHE_KEY_BOOTSTRAP);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis fallback
    }

    const foodStatus = await this.isVerticalAvailable(VERTICALS.FOOD);
    const groceryStatus = await this.isVerticalAvailable(VERTICALS.GROCERY);

    const payload = {
      verticals: {
        [VERTICALS.FOOD]: {
          enabled: foodStatus.available,
          mode: foodStatus.mode,
          message: foodStatus.message,
        },
        [VERTICALS.GROCERY]: {
          enabled: groceryStatus.available,
          mode: groceryStatus.mode,
          message: groceryStatus.message,
        },
      },
      supportPhone: '+91 99999 99999',
      minAppVersion: '1.0.0',
      maintenance: false,
    };

    try {
      await redis.set(CACHE_KEY_BOOTSTRAP, JSON.stringify(payload), 'EX', CACHE_TTL_SECONDS);
    } catch {
      // ignore redis error
    }

    return payload;
  }

  /**
   * Admin updates feature flag / vertical switch
   */
  async setFeatureFlag({ key, mode, scope = { level: 'global' }, message, schedule, actor, reason, requestId }) {
    const existing = await FeatureFlag.findOne({
      key,
      'scope.level': scope.level,
      'scope.refId': scope.refId || null,
    });

    const before = existing ? existing.toObject() : null;

    const flag = await FeatureFlag.findOneAndUpdate(
      { key, 'scope.level': scope.level, 'scope.refId': scope.refId || null },
      {
        $set: {
          mode,
          message,
          schedule,
          updatedBy: { id: actor.id, role: actor.role },
          reason,
        },
      },
      { upsert: true, new: true }
    );

    // Invalidate Redis cache
    try {
      await redis.del(CACHE_KEY_BOOTSTRAP);
    } catch (e) {
      logger.warn('[Settings] Cache invalidation failed', { error: e.message });
    }

    // Audit log
    await auditService.log({
      actor,
      action: 'FEATURE_FLAG_SET',
      entity: { type: 'FeatureFlag', id: flag._id },
      before,
      after: flag.toObject(),
      reason,
      requestId,
    });

    // Record outbox event
    await outboxService.record({
      eventName: 'vertical.toggled.v1',
      aggregateType: 'FeatureFlag',
      aggregateId: flag._id,
      payload: { key, mode, scope, message, updatedBy: actor.id },
    });

    return flag;
  }

  async getAllFlags() {
    return FeatureFlag.find().sort({ key: 1, 'scope.level': 1 }).lean();
  }
}

module.exports = new SettingsService();
