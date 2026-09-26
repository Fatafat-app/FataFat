'use strict';

/**
 * search.service.js — Combined geo + text search.
 *
 * Searches restaurants by name/cuisine and optionally filters by proximity.
 * Uses MongoDB's $text operator (requires text index on Restaurant model).
 */

const Restaurant = require('../restaurants/restaurant.model');
const MenuItem = require('../menu/menuItem.model');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');

/**
 * Search restaurants by text query, filtered by location.
 *
 * @param {string} q                   - Search query
 * @param {{ lat?: number, lng?: number, radiusKm?: number }} location
 * @param {object} queryParams         - Pagination params
 */
async function searchRestaurants(q, { lat, lng, radiusKm = 10 }, queryParams) {
  const { page, limit, skip } = getPagination(queryParams);
  const filter = { isActive: true, isApproved: true };

  if (q) {
    filter.$text = { $search: q };
  }

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: radiusKm * 1000,
      },
    };
  }

  const sortOptions = q ? { score: { $meta: 'textScore' } } : { 'rating.average': -1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter, q ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  return { restaurants, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * Search menu items by name/description across all restaurants.
 *
 * @param {string} q - Search query
 * @param {object} queryParams
 */
async function searchMenuItems(q, queryParams) {
  const { page, limit, skip } = getPagination(queryParams);

  const filter = { isAvailable: true };
  if (q) filter.$text = { $search: q };

  const sortOptions = q ? { score: { $meta: 'textScore' } } : { name: 1 };

  const [items, total] = await Promise.all([
    MenuItem.find(filter, q ? { score: { $meta: 'textScore' } } : {})
      .populate('restaurant', 'name isOpen coverImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    MenuItem.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

module.exports = { searchRestaurants, searchMenuItems };
