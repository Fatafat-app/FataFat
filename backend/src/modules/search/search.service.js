'use strict';

const Restaurant = require('../restaurants/restaurant.model');
const MenuItem = require('../menu/menuItem.model');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');

async function searchRestaurants(q, { lat, lng, radiusKm = 50 } = {}, queryParams = {}) {
  const { page, limit, skip } = getPagination(queryParams);
  const filter = { isActive: { $ne: false } };

  if (q && q.trim()) {
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { cuisines: regex },
      { 'address.city': regex },
      { 'address.line1': regex },
    ];
  }

  const hasCoords = !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (parseFloat(lat) !== 0 || parseFloat(lng) !== 0);

  let restaurants = [];
  let total = 0;

  if (hasCoords) {
    try {
      const geoFilter = {
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: Math.max((radiusKm || 50) * 1000, 50000),
          },
        },
      };

      [restaurants, total] = await Promise.all([
        Restaurant.find(geoFilter).skip(skip).limit(limit),
        Restaurant.countDocuments(geoFilter),
      ]);
    } catch (err) {
      // Fallback if geo index fails
    }
  }

  if (restaurants.length === 0) {
    [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .sort({ 'rating.average': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(filter),
    ]);
  }

  return { restaurants, meta: buildPaginationMeta(total, page, limit) };
}

async function searchMenuItems(q, queryParams = {}) {
  const { page, limit, skip } = getPagination(queryParams);

  const filter = { isAvailable: { $ne: false } };
  if (q && q.trim()) {
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { tags: regex },
    ];
  }

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo')
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MenuItem.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
}

module.exports = { searchRestaurants, searchMenuItems };
