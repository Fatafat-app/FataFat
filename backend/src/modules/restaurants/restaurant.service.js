'use strict';

/**
 * restaurant.service.js — Restaurant business logic.
 */

const Restaurant = require('./restaurant.model');
const { NotFoundError, ForbiddenError, BusinessError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const CACHE_TTL = 60; // 60 seconds for restaurant listing cache
const CACHE_PREFIX = 'restaurant:';

// ─── Cache Helpers ──────────────────────────────────────────────

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

// ─── Service Functions ──────────────────────────────────────────

/**
 * Create a new restaurant.
 * @param {string} ownerId
 * @param {object} data
 */
async function createRestaurant(ownerId, data) {
  const restaurant = await Restaurant.create({ ...data, owner: ownerId });
  await invalidateCache('list:*');
  return restaurant;
}

/**
 * Get a restaurant by ID.
 * Cached for CACHE_TTL seconds.
 */
async function getRestaurantById(restaurantId) {
  const cacheKey = `${CACHE_PREFIX}${restaurantId}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const restaurant = await Restaurant.findById(restaurantId).populate('owner', 'name phone');
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  await setCache(cacheKey, restaurant);
  return restaurant;
}

/**
 * Update restaurant details.
 * Only the owner or admin can update.
 */
async function updateRestaurant(restaurantId, updates, requestingUser) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  const isOwner = restaurant.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You do not have permission to update this restaurant');
  }

  // Admin-only fields
  const adminFields = ['isActive', 'isApproved'];
  if (!isAdmin) {
    adminFields.forEach((field) => delete updates[field]);
  }

  Object.assign(restaurant, updates);
  await restaurant.save();

  await invalidateCache(`${restaurantId}`);
  await invalidateCache('list:*');

  return restaurant;
}

/**
 * Find restaurants near a coordinate.
 * Results are paginated.
 *
 * @param {{ lat: number, lng: number, radiusKm?: number }} location
 * @param {object} query - req.query for pagination/filters
 */
async function findNearbyRestaurants({ lat, lng, radiusKm = 5 }, query) {
  const { page, limit, skip } = getPagination(query);
  const maxDistance = radiusKm * 1000; // Convert km to metres

  const filter = {
    isActive: true,
    isApproved: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxDistance,
      },
    },
  };

  if (query.cuisine) {
    filter.cuisines = { $in: [query.cuisine] };
  }

  if (query.isOpen === 'true') {
    filter.isOpen = true;
  }

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  return {
    restaurants,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * Toggle restaurant open/closed status.
 * Only the owner can toggle.
 */
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

/**
 * Get all restaurants owned by a user.
 */
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
};
