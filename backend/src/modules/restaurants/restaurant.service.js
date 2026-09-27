'use strict';

const Restaurant = require('./restaurant.model');
const { NotFoundError, ForbiddenError, BusinessError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const CACHE_TTL = 60;
const CACHE_PREFIX = 'restaurant:';

async function getCached(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn('[Cache] Read failed', { key, error: err.message });
    return null;
  }
}

async function setCache(key, data, ttl = CACHE_TTL) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    logger.warn('[Cache] Write failed', { key, error: err.message });
  }
}

async function invalidateCache(pattern) {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.warn('[Cache] Invalidation failed', { pattern, error: err.message });
  }
}

async function createRestaurant(ownerId, data) {
  const restaurant = await Restaurant.create({
    ...data,
    owner: ownerId,
    isActive: true,
    isApproved: true,
    isOpen: true,
  });
  await invalidateCache('list:*');
  return restaurant;
}

async function getRestaurantById(restaurantId) {
  const cacheKey = `${CACHE_PREFIX}${restaurantId}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const restaurant = await Restaurant.findById(restaurantId).populate('owner', 'name phone');
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  await setCache(cacheKey, restaurant);
  return restaurant;
}

async function updateRestaurant(restaurantId, updates, requestingUser) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  const isOwner = restaurant.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You do not have permission to update this restaurant');
  }

  const adminFields = ['isActive', 'isApproved'];
  if (!isAdmin) {
    adminFields.forEach((field) => delete updates[field]);
  }

  if (updates.address) {
    restaurant.address = {
      line1: updates.address.line1 !== undefined ? updates.address.line1 : restaurant.address?.line1,
      line2: updates.address.line2 !== undefined ? updates.address.line2 : restaurant.address?.line2,
      city: updates.address.city !== undefined ? updates.address.city : restaurant.address?.city,
      state: updates.address.state !== undefined ? updates.address.state : restaurant.address?.state,
      pincode: updates.address.pincode !== undefined ? updates.address.pincode : restaurant.address?.pincode,
    };
    delete updates.address;
  }

  if (updates.deliveryInfo) {
    restaurant.deliveryInfo = {
      minOrderAmount: updates.deliveryInfo.minOrderAmount !== undefined ? Number(updates.deliveryInfo.minOrderAmount) : restaurant.deliveryInfo?.minOrderAmount,
      deliveryFee: updates.deliveryInfo.deliveryFee !== undefined ? Number(updates.deliveryInfo.deliveryFee) : restaurant.deliveryInfo?.deliveryFee,
      estimatedMinutes: updates.deliveryInfo.estimatedMinutes !== undefined ? Number(updates.deliveryInfo.estimatedMinutes) : restaurant.deliveryInfo?.estimatedMinutes,
      radiusKm: updates.deliveryInfo.radiusKm !== undefined ? Number(updates.deliveryInfo.radiusKm) : restaurant.deliveryInfo?.radiusKm,
    };
    delete updates.deliveryInfo;
  }

  if (updates.timings) {
    restaurant.timings = {
      open: updates.timings.open !== undefined ? updates.timings.open : restaurant.timings?.open,
      close: updates.timings.close !== undefined ? updates.timings.close : restaurant.timings?.close,
    };
    delete updates.timings;
  }

  if (updates.location && Array.isArray(updates.location.coordinates)) {
    restaurant.location = {
      type: 'Point',
      coordinates: updates.location.coordinates.map(Number),
    };
    delete updates.location;
  }

  Object.assign(restaurant, updates);
  await restaurant.save();

  await invalidateCache(`${restaurantId}`);
  await invalidateCache('list:*');

  return restaurant;
}

async function findNearbyRestaurants({ lat, lng, radiusKm = 50 }, query = {}) {
  const { page, limit, skip } = getPagination(query);
  const maxDistance = Math.max((radiusKm || 50) * 1000, 50000); // at least 50km radius

  const filter = {
    isActive: { $ne: false },
  };

  if (query.cuisine) {
    filter.cuisines = { $in: [query.cuisine] };
  }

  if (query.isOpen === 'true') {
    filter.isOpen = true;
  }

  const hasCoords = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

  let restaurants = [];
  let total = 0;

  if (hasCoords) {
    try {
      const geoFilter = {
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistance,
          },
        },
      };

      [restaurants, total] = await Promise.all([
        Restaurant.find(geoFilter).skip(skip).limit(limit),
        Restaurant.countDocuments(geoFilter),
      ]);
    } catch (err) {
      logger.warn('[GeoQuery] Fallback to standard query', { error: err.message });
    }
  }

  // Fallback: if geo query returned 0 items or no coords, return active restaurants
  if (restaurants.length === 0) {
    [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort('-createdAt').skip(skip).limit(limit),
      Restaurant.countDocuments(filter),
    ]);
  }

  return {
    restaurants,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function toggleOpenStatus(restaurantId, ownerId) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  if (restaurant.owner.toString() !== ownerId) {
    throw new ForbiddenError('Only the restaurant owner can change open status');
  }

  if (!restaurant.isActive || !restaurant.isApproved) {
    throw new BusinessError('Restaurant is not yet approved. Contact admin.', 'RESTAURANT_NOT_APPROVED');
  }

  restaurant.isOpen = !restaurant.isOpen;
  await restaurant.save();

  await invalidateCache(`${restaurantId}`);
  return restaurant;
}

async function listRestaurants(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { 'address.city': { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).populate('owner', 'name phone email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  return {
    restaurants,
    meta: buildPaginationMeta(total, page, limit),
  };
}

async function getOwnerRestaurants(ownerId) {
  return Restaurant.find({ owner: ownerId });
}

module.exports = {
  createRestaurant,
  getRestaurantById,
  updateRestaurant,
  findNearbyRestaurants,
  toggleOpenStatus,
  getOwnerRestaurants,
  listRestaurants,
};
