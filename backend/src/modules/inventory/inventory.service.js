'use strict';

const VendorListing = require('../catalog/vendorListing.model');
const InventoryMovement = require('./inventoryMovement.model');
const { BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');

class InventoryService {
  /**
   * Atomically reserve stock for multiple items in a single checkout session
   * @param {Array<{ listingId: string, quantity: number }>} items
   * @param {string} orderId
   * @param {object} actor
   */
  async reserveStock(items, orderId = null, actor = null) {
    const reservedItems = [];

    try {
      for (const item of items) {
        const { listingId, quantity } = item;
        const listing = await VendorListing.findById(listingId);

        if (!listing) {
          throw new BusinessError(`Listing not found: ${listingId}`, ERROR_CODES.NOT_FOUND);
        }

        if (!listing.isAvailable) {
          throw new BusinessError(`Item is not available: ${listingId}`, ERROR_CODES.ITEM_UNAVAILABLE);
        }

        // Only enforce stock check if tracking is enabled
        if (listing.stock?.track) {
          const updated = await VendorListing.findOneAndUpdate(
            {
              _id: listingId,
              'stock.track': true,
              'stock.available': { $gte: quantity },
            },
            {
              $inc: {
                'stock.available': -quantity,
                'stock.reserved': quantity,
              },
            },
            { new: true }
          );

          if (!updated) {
            throw new BusinessError(
              `Insufficient stock for item: ${listingId}`,
              ERROR_CODES.OUT_OF_STOCK,
              400,
              { listingId, requestedQuantity: quantity }
            );
          }

          reservedItems.push({ listingId, quantity, vendorId: listing.vendorId });

          // Record movement
          await InventoryMovement.create({
            listingId,
            vendorId: listing.vendorId,
            delta: -quantity,
            reason: 'ORDER_RESERVED',
            orderId,
            actor: actor ? { id: actor.id, role: actor.role } : null,
            snapshot: {
              availableBefore: updated.stock.available + quantity,
              availableAfter: updated.stock.available,
              reservedBefore: updated.stock.reserved - quantity,
              reservedAfter: updated.stock.reserved,
            },
          });
        }
      }

      return { success: true, reservedItems };
    } catch (err) {
      // Rollback any items already reserved in this loop
      logger.warn('[Inventory] Stock reservation failed, rolling back', { err: err.message });
      for (const res of reservedItems) {
        await VendorListing.findByIdAndUpdate(res.listingId, {
          $inc: {
            'stock.available': res.quantity,
            'stock.reserved': -res.quantity,
          },
        });
      }
      throw err;
    }
  }

  /**
   * Commit reservation upon successful payment capture
   */
  async commitReservation(items, orderId = null, actor = null) {
    for (const item of items) {
      const { listingId, quantity } = item;
      const listing = await VendorListing.findById(listingId);
      if (!listing || !listing.stock?.track) continue;

      const updated = await VendorListing.findByIdAndUpdate(
        listingId,
        {
          $inc: { 'stock.reserved': -quantity },
        },
        { new: true }
      );

      await InventoryMovement.create({
        listingId,
        vendorId: listing.vendorId,
        delta: -quantity,
        reason: 'ORDER_COMMITTED',
        orderId,
        actor: actor ? { id: actor.id, role: actor.role } : null,
      });
    }
  }

  /**
   * Release reserved stock on order timeout, cancellation, or payment failure
   */
  async releaseReservation(items, orderId = null, actor = null, reason = 'ORDER_RELEASED') {
    for (const item of items) {
      const { listingId, quantity } = item;
      const listing = await VendorListing.findById(listingId);
      if (!listing || !listing.stock?.track) continue;

      await VendorListing.findByIdAndUpdate(listingId, {
        $inc: {
          'stock.available': quantity,
          'stock.reserved': -quantity,
        },
      });

      await InventoryMovement.create({
        listingId,
        vendorId: listing.vendorId,
        delta: quantity,
        reason,
        orderId,
        actor: actor ? { id: actor.id, role: actor.role } : null,
      });
    }
  }

  /**
   * Adjust stock manually by Admin or Merchant
   */
  async adjustStock({ listingId, available, actor, reason = 'ADMIN_SET' }) {
    const listing = await VendorListing.findById(listingId);
    if (!listing) throw new BusinessError('Listing not found', ERROR_CODES.NOT_FOUND);

    const prevAvailable = listing.stock.available;
    const delta = available - prevAvailable;

    listing.stock.available = available;
    listing.stock.track = true;
    await listing.save();

    await InventoryMovement.create({
      listingId,
      vendorId: listing.vendorId,
      delta,
      reason,
      actor: { id: actor.id, role: actor.role },
      snapshot: {
        availableBefore: prevAvailable,
        availableAfter: available,
        reservedBefore: listing.stock.reserved,
        reservedAfter: listing.stock.reserved,
      },
    });

    return listing;
  }
}

module.exports = new InventoryService();
