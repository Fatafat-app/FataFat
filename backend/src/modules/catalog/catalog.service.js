'use strict';

const CatalogItem = require('./catalogItem.model');
const VendorListing = require('./vendorListing.model');
const Category = require('./category.model');
const { BusinessError, NotFoundError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const auditService = require('../audit');
const outboxService = require('../outbox');

class CatalogService {
  async getCategories({ vertical = null } = {}) {
    const filter = { isActive: true };
    if (vertical) {
      filter.$or = [{ vertical }, { vertical: 'both' }];
    }
    return Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  }

  async createCategory(data, actor = null) {
    const category = new Category(data);
    await category.save();

    if (actor) {
      await auditService.log({
        actor,
        action: 'CATEGORY_CREATED',
        entity: { type: 'Category', id: category._id },
        after: category.toObject(),
      });
    }

    return category;
  }

  async createMasterItem(data, actor) {
    const item = new CatalogItem({
      ...data,
      scope: 'master',
      createdBy: { userId: actor.id, role: actor.role },
    });
    await item.save();

    await auditService.log({
      actor,
      action: 'MASTER_ITEM_CREATED',
      entity: { type: 'CatalogItem', id: item._id },
      after: item.toObject(),
    });

    return item;
  }

  async createVendorItem(data, actor) {
    const item = new CatalogItem({
      ...data,
      scope: 'vendor',
      createdBy: { userId: actor.id, role: actor.role },
    });
    await item.save();

    // Create default listing for the vendor
    const listing = new VendorListing({
      vendorId: data.vendorId,
      itemId: item._id,
      vertical: data.vertical,
      pricePaise: data.pricePaise,
      mrpPaise: data.mrpPaise,
      variants: data.variants || [],
      addonGroups: data.addonGroups || [],
      stock: data.stock || { track: false, available: 0, reserved: 0 },
      isAvailable: data.isAvailable !== false,
    });
    await listing.save();

    await auditService.log({
      actor,
      action: 'VENDOR_ITEM_CREATED',
      entity: { type: 'CatalogItem', id: item._id },
      after: { item: item.toObject(), listing: listing.toObject() },
    });

    return { item, listing };
  }

  async createListing(data, actor) {
    const listing = new VendorListing(data);
    await listing.save();

    await auditService.log({
      actor,
      action: 'VENDOR_LISTING_CREATED',
      entity: { type: 'VendorListing', id: listing._id },
      after: listing.toObject(),
    });

    await outboxService.record({
      eventName: 'catalog.item_listed.v1',
      aggregateType: 'VendorListing',
      aggregateId: listing._id,
      payload: { vendorId: listing.vendorId, itemId: listing.itemId },
    });

    return listing;
  }

  async updateListing(listingId, updates, actor, expectedVersion = null) {
    const query = { _id: listingId };
    if (expectedVersion !== null) {
      query.version = expectedVersion;
    }

    const existing = await VendorListing.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found', ERROR_CODES.NOT_FOUND);

    // Check locked fields if actor is not super_admin/admin
    if (actor.role !== 'super_admin' && actor.role !== 'admin' && existing.lockedFields?.length) {
      for (const field of existing.lockedFields) {
        if (updates[field] !== undefined && updates[field] !== existing[field]) {
          throw new BusinessError(`Field '${field}' is regulated and locked by platform admin`, ERROR_CODES.FORBIDDEN);
        }
      }
    }

    const updated = await VendorListing.findOneAndUpdate(
      query,
      {
        $set: updates,
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated && expectedVersion !== null) {
      throw new BusinessError(
        'Concurrent edit conflict. The item was modified by another user.',
        ERROR_CODES.STALE_VERSION,
        409
      );
    }

    await auditService.log({
      actor,
      action: 'LISTING_UPDATED',
      entity: { type: 'VendorListing', id: listingId },
      before: existing.toObject(),
      after: updated.toObject(),
    });

    return updated;
  }

  async search({ vertical, q, vendorId, categoryId, page = 1, limit = 20 }) {
    const filter = { isAvailable: true };
    if (vertical) filter.vertical = vertical;
    if (vendorId) filter.vendorId = vendorId;

    const skip = (page - 1) * limit;

    const listings = await VendorListing.find(filter)
      .populate({
        path: 'itemId',
        match: {
          status: 'active',
          ...(categoryId ? { categoryId } : {}),
          ...(q ? { $text: { $search: q } } : {}),
        },
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out listings where populated itemId is null (e.g. didn't match search/status)
    const validListings = listings.filter((l) => l.itemId != null);

    return { listings: validListings, page, limit };
  }
}

module.exports = new CatalogService();
