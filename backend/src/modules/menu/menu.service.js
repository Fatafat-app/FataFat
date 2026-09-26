'use strict';

/**
 * menu.service.js — Menu management business logic.
 */

const MenuCategory = require('./menuCategory.model');
const MenuItem = require('./menuItem.model');
const { NotFoundError, ForbiddenError } = require('../../common/errors');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const MENU_CACHE_TTL = 120; // 2 minutes

function menuCacheKey(restaurantId) {
  return `menu:${restaurantId}`;
}

async function invalidateMenuCache(restaurantId) {
  try {
    await redis.del(menuCacheKey(restaurantId));
  } catch (err) {
    logger.warn('[Cache] Menu cache invalidation failed', { restaurantId, error: err.message });
  }
}

/**
 * Get full menu for a restaurant — categories with their items.
 * Result is cached in Redis.
 *
 * @param {string} restaurantId
 * @param {boolean} [includeUnavailable] - Admin/owner view
 */
async function getMenuByRestaurant(restaurantId, includeUnavailable = false) {
  const cacheKey = menuCacheKey(restaurantId);

  if (!includeUnavailable) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn('[Cache] Menu read failed', { error: err.message });
    }
  }

  const [categories, items] = await Promise.all([
    MenuCategory.find({ restaurant: restaurantId, isActive: true }).sort('sortOrder'),
    MenuItem.find({
      restaurant: restaurantId,
      ...(includeUnavailable ? {} : { isAvailable: true }),
    }).sort('sortOrder'),
  ]);

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const catId = item.category.toString();
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {});

  const menu = categories.map((cat) => ({
    ...cat.toJSON(),
    items: itemsByCategory[cat._id.toString()] || [],
  }));

  if (!includeUnavailable) {
    try {
      await redis.set(cacheKey, JSON.stringify(menu), 'EX', MENU_CACHE_TTL);
    } catch (err) {
      logger.warn('[Cache] Menu write failed', { error: err.message });
    }
  }

  return menu;
}

/**
 * Add a category to a restaurant's menu.
 */
async function addCategory(restaurantId, data) {
  const category = await MenuCategory.create({ restaurant: restaurantId, ...data });
  await invalidateMenuCache(restaurantId);
  return category;
}

/**
 * Update a menu category.
 */
async function updateCategory(categoryId, restaurantId, updates) {
  const category = await MenuCategory.findOneAndUpdate(
    { _id: categoryId, restaurant: restaurantId },
    updates,
    { new: true, runValidators: true }
  );

  if (!category) throw new NotFoundError('Category not found');
  await invalidateMenuCache(restaurantId);
  return category;
}

/**
 * Add a menu item to a category.
 */
async function addMenuItem(restaurantId, data) {
  // Verify the category belongs to this restaurant
  const category = await MenuCategory.findOne({
    _id: data.category,
    restaurant: restaurantId,
  });

  if (!category) throw new NotFoundError('Category not found in this restaurant');

  const item = await MenuItem.create({ restaurant: restaurantId, ...data });
  await invalidateMenuCache(restaurantId);
  return item;
}

/**
 * Update a menu item.
 */
async function updateMenuItem(itemId, restaurantId, updates) {
  const item = await MenuItem.findOneAndUpdate(
    { _id: itemId, restaurant: restaurantId },
    updates,
    { new: true, runValidators: true }
  );

  if (!item) throw new NotFoundError('Menu item not found');
  await invalidateMenuCache(restaurantId);
  return item;
}

/**
 * Toggle a menu item's availability.
 */
async function toggleItemAvailability(itemId, restaurantId) {
  const item = await MenuItem.findOne({ _id: itemId, restaurant: restaurantId });
  if (!item) throw new NotFoundError('Menu item not found');

  item.isAvailable = !item.isAvailable;
  await item.save();
  await invalidateMenuCache(restaurantId);
  return item;
}

/**
 * Get a single menu item by ID.
 */
async function getMenuItem(itemId) {
  const item = await MenuItem.findById(itemId).populate('category', 'name');
  if (!item) throw new NotFoundError('Menu item not found');
  return item;
}

module.exports = {
  getMenuByRestaurant,
  addCategory,
  updateCategory,
  addMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  getMenuItem,
};
