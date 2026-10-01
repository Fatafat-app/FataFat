'use strict';

const Vendor = require('./vendor.model');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const auditService = require('../audit');

class VendorService {
  async getById(vendorId) {
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) throw new NotFoundError(`Vendor not found: ${vendorId}`, ERROR_CODES.NOT_FOUND);
    return vendor;
  }

  async list({ vertical, type, isOpen, isActive = true, page = 1, limit = 20, lat, lng, radiusM = 10000 }) {
    const query = { isActive };
    if (vertical) query.vertical = vertical;
    if (type) query.type = type;
    if (typeof isOpen === 'boolean') query.isOpen = isOpen;

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radiusM, 10),
        },
      };
    }

    const skip = (page - 1) * limit;
    const [vendors, total] = await Promise.all([
      Vendor.find(query).skip(skip).limit(limit).lean(),
      Vendor.countDocuments(query),
    ]);

    return { vendors, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data, actor = null) {
    const vendor = new Vendor(data);
    await vendor.save();

    if (actor) {
      await auditService.log({
        actor,
        action: 'VENDOR_CREATED',
        entity: { type: 'Vendor', id: vendor._id },
        after: vendor.toObject(),
      });
    }

    return vendor;
  }

  async update(vendorId, updates, actor = null, reason = null) {
    const existing = await Vendor.findById(vendorId);
    if (!existing) throw new NotFoundError('Vendor not found', ERROR_CODES.NOT_FOUND);

    const before = existing.toObject();
    Object.assign(existing, updates);
    await existing.save();

    if (actor) {
      await auditService.log({
        actor,
        action: 'VENDOR_UPDATED',
        entity: { type: 'Vendor', id: vendorId },
        before,
        after: existing.toObject(),
        reason,
      });
    }

    return existing;
  }

  async pauseVendor(vendorId, { pausedUntil, pauseReason, actor }) {
    return this.update(
      vendorId,
      {
        isOpen: false,
        pausedUntil: pausedUntil ? new Date(pausedUntil) : null,
        pauseReason,
      },
      actor,
      `Vendor paused: ${pauseReason}`
    );
  }

  async resumeVendor(vendorId, actor) {
    return this.update(
      vendorId,
      {
        isOpen: true,
        pausedUntil: null,
        pauseReason: null,
      },
      actor,
      'Vendor resumed'
    );
  }
}

module.exports = new VendorService();
