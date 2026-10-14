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

  if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
    const vegCond = [
      { isPureVeg: true },
      { cuisines: { $regex: /veg/i } },
      { name: { $regex: /veg/i } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: vegCond }];
      delete filter.$or;
    } else {
      filter.$or = vegCond;
    }
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
        Restaurant.countDocuments(filter), // countDocuments doesn't support $near
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

  if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
    filter.isVeg = true;
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

async function getRecommendedItems(queryParams = {}) {
  const limit = Math.min(parseInt(queryParams.limit, 10) || 20, 50);
  const filter = { isAvailable: { $ne: false } };

  if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
    filter.isVeg = true;
  }

  const items = await MenuItem.find(filter)
    .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo isPureVeg')
    .sort({ isBestseller: -1, 'rating.average': -1, sortOrder: 1, createdAt: -1 })
    .limit(limit);

  return { items };
}

async function getUnder99Items(queryParams = {}) {
  const limit = Math.min(parseInt(queryParams.limit, 10) || 30, 60);
  // Price is stored in paise; ₹99 = 9900 paise
  const filter = {
    isAvailable: { $ne: false },
    price: { $gt: 0, $lte: 9900 },
  };

  if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
    filter.isVeg = true;
  }

  const items = await MenuItem.find(filter)
    .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo isPureVeg')
    .sort({ isBestseller: -1, 'rating.average': -1, price: 1 })
    .limit(limit);

  return { items };
}

async function getTrendingItems(queryParams = {}) {
  const limit = Math.min(parseInt(queryParams.limit, 10) || 20, 50);
  const filter = {
    isAvailable: { $ne: false },
    $or: [
      { isBestseller: true },
      { tags: { $in: ['trending', 'bestseller'] } },
      { 'rating.average': { $gte: 4.5 } },
    ],
  };

  if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
    filter.isVeg = true;
  }

  let items = await MenuItem.find(filter)
    .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo isPureVeg')
    .sort({ isBestseller: -1, 'rating.average': -1, createdAt: -1 })
    .limit(limit);

  // If few items matched the strict trending filter, fallback to any available items
  if (items.length < 5) {
    const fallbackFilter = { isAvailable: { $ne: false } };
    if (queryParams.isVeg === 'true' || queryParams.isVeg === true) {
      fallbackFilter.isVeg = true;
    }
    items = await MenuItem.find(fallbackFilter)
      .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo isPureVeg')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(limit);
  }

  return { items };
}

async function getMenuItemById(id) {
  if (!id) return null;
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return MenuItem.findById(id)
    .populate('restaurant', 'name isOpen coverImage images address rating deliveryInfo isPureVeg phone cuisines taxPercent');
}

module.exports = {
  searchRestaurants,
  searchMenuItems,
  getRecommendedItems,
  getUnder99Items,
  getTrendingItems,
  getMenuItemById,
};
