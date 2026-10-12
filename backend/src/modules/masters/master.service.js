'use strict';

const mongoose = require('mongoose');
const Cuisine = require('./cuisine.model');
const DietaryType = require('./dietaryType.model');
const CancellationReason = require('./cancellationReason.model');
const Category = require('../catalog/category.model');
const AuditLog = require('../admin/auditLog.model');
const { BusinessError, NotFoundError } = require('../../common/errors');

const MODEL_MAP = {
  cuisines: Cuisine,
  cuisine: Cuisine,
  'dietary-types': DietaryType,
  dietary: DietaryType,
  'cancellation-reasons': CancellationReason,
  cancellation: CancellationReason,
  categories: Category,
  category: Category,
};

function resolveModel(type) {
  const model = MODEL_MAP[type.toLowerCase()];
  if (!model) {
    throw new BusinessError(`Invalid master data type: ${type}`, 'INVALID_MASTER_TYPE');
  }
  return model;
}

class MasterService {
  /**
   * List master records for a given entity type
   */
  async list(type, query = {}, isPublic = false) {
    const Model = resolveModel(type);
    const filter = {};

    if (isPublic) {
      filter.isActive = true;
    } else if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.role && (type === 'cancellation-reasons' || type === 'cancellation')) {
      filter.$or = [{ role: query.role }, { role: 'all' }];
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { code: searchRegex }];
    }

    if (query.vertical && (type === 'categories' || type === 'category')) {
      filter.$or = [{ vertical: query.vertical }, { vertical: 'both' }];
    }

    const sort = { sortOrder: 1, name: 1 };
    return Model.find(filter).sort(sort).lean();
  }

  /**
   * Get single master record by ID
   */
  async getById(type, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BusinessError('Invalid Master Record ID', 'INVALID_OBJECT_ID');
    }
    const Model = resolveModel(type);
    const record = await Model.findById(id).lean();
    if (!record) {
      throw new NotFoundError(`${type} record not found`);
    }
    return record;
  }

  /**
   * Create a new master record
   */
  async create(type, payload, adminId, meta = {}) {
    const Model = resolveModel(type);

    let code = (payload.code || '').trim().toUpperCase();
    if (!code && payload.name) {
      code = payload.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    }

    if (!code) {
      throw new BusinessError('Master code is required', 'VALIDATION_ERROR');
    }

    // Check unique code
    const existing = await Model.findOne({ code });
    if (existing) {
      throw new BusinessError(`Master record with code '${code}' already exists`, 'CODE_ALREADY_EXISTS');
    }

    const count = await Model.countDocuments();
    const sortOrder = payload.sortOrder !== undefined ? Number(payload.sortOrder) : count + 1;

    const recordData = {
      ...payload,
      code,
      sortOrder,
      isActive: payload.isActive !== false,
      createdBy: adminId,
      updatedBy: adminId,
    };

    const doc = await Model.create(recordData);

    // Audit Log
    try {
      await AuditLog.create({
        adminId,
        action: `MASTER_CREATE_${type.toUpperCase().replace(/-/g, '_')}`,
        resource: Model.modelName,
        resourceId: String(doc._id),
        changes: { after: doc.toObject ? doc.toObject() : doc },
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Non-blocking audit error
    }

    return doc;
  }

  /**
   * Update master record
   */
  async update(type, id, payload, adminId, meta = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BusinessError('Invalid Master Record ID', 'INVALID_OBJECT_ID');
    }
    const Model = resolveModel(type);
    const doc = await Model.findById(id);
    if (!doc) {
      throw new NotFoundError(`${type} record not found`);
    }

    const before = doc.toObject ? doc.toObject() : doc;

    if (payload.code) {
      const code = payload.code.trim().toUpperCase();
      if (code !== doc.code) {
        const existing = await Model.findOne({ code, _id: { $ne: id } });
        if (existing) {
          throw new BusinessError(`Master record with code '${code}' already exists`, 'CODE_ALREADY_EXISTS');
        }
        doc.code = code;
      }
    }

    if (payload.name !== undefined) doc.name = payload.name.trim();
    if (payload.description !== undefined) doc.description = payload.description.trim();
    if (payload.iconUrl !== undefined) doc.iconUrl = payload.iconUrl;
    if (payload.image !== undefined) doc.image = payload.image;
    if (payload.coverImage !== undefined) doc.coverImage = payload.coverImage;
    if (payload.isActive !== undefined) doc.isActive = Boolean(payload.isActive);
    if (payload.sortOrder !== undefined) doc.sortOrder = Number(payload.sortOrder);
    if (payload.order !== undefined) doc.order = Number(payload.order);
    if (payload.role !== undefined) doc.role = payload.role;
    if (payload.colorCode !== undefined) doc.colorCode = payload.colorCode;
    if (payload.badgeIcon !== undefined) doc.badgeIcon = payload.badgeIcon;
    if (payload.isPopular !== undefined) doc.isPopular = Boolean(payload.isPopular);
    if (payload.requiresRemarks !== undefined) doc.requiresRemarks = Boolean(payload.requiresRemarks);
    if (payload.triggersAutoRefund !== undefined) doc.triggersAutoRefund = Boolean(payload.triggersAutoRefund);
    if (payload.metadata !== undefined) doc.metadata = payload.metadata;

    doc.updatedBy = adminId;
    await doc.save();

    // Audit Log
    try {
      await AuditLog.create({
        adminId,
        action: `MASTER_UPDATE_${type.toUpperCase().replace(/-/g, '_')}`,
        resource: Model.modelName,
        resourceId: String(doc._id),
        changes: { before, after: doc.toObject ? doc.toObject() : doc },
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Non-blocking audit error
    }

    return doc;
  }

  /**
   * Delete or soft-deactivate master record
   */
  async delete(type, id, adminId, meta = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BusinessError('Invalid Master Record ID', 'INVALID_OBJECT_ID');
    }
    const Model = resolveModel(type);
    const doc = await Model.findById(id);
    if (!doc) {
      throw new NotFoundError(`${type} record not found`);
    }

    const before = doc.toObject ? doc.toObject() : doc;

    // Hard delete if not referenced or perform delete
    await Model.findByIdAndDelete(id);

    try {
      await AuditLog.create({
        adminId,
        action: `MASTER_DELETE_${type.toUpperCase().replace(/-/g, '_')}`,
        resource: Model.modelName,
        resourceId: String(id),
        changes: { before },
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Non-blocking
    }

    return { message: 'Master record deleted successfully' };
  }

  /**
   * Reorder master items in bulk
   */
  async reorder(type, items = [], adminId, meta = {}) {
    const Model = resolveModel(type);
    const operations = items.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id || item._id },
        update: {
          $set: {
            sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : index + 1,
            order: item.order !== undefined ? Number(item.order) : index + 1,
            updatedBy: adminId,
          },
        },
      },
    }));

    if (operations.length > 0) {
      await Model.bulkWrite(operations);
    }

    try {
      await AuditLog.create({
        adminId,
        action: `MASTER_REORDER_${type.toUpperCase().replace(/-/g, '_')}`,
        resource: Model.modelName,
        resourceId: 'BULK',
        changes: { items },
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Non-blocking
    }

    return Model.find().sort({ sortOrder: 1, name: 1 }).lean();
  }
}

module.exports = new MasterService();
