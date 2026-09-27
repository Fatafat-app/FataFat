'use strict';

const mongoose = require('mongoose');
const MenuCategory = require('./menuCategory.model');
const MenuItem = require('./menuItem.model');
const { NotFoundError } = require('../../common/errors');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const MENU_CACHE_TTL = 120;

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

  const itemsByCategory = items.reduce((acc, item) => {
    const catId = item.category.toString();
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {});

  const menu = categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    category: cat.name,
    sortOrder: cat.sortOrder,
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

async function addCategory(restaurantId, data) {
  const category = await MenuCategory.create({ restaurant: restaurantId, ...data });
  await invalidateMenuCache(restaurantId);
  return category;
}

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

async function addMenuItem(restaurantId, data) {
  let categoryId = data.category;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const found = await MenuCategory.findOne({
      restaurant: restaurantId,
      name: { $regex: new RegExp(`^${categoryId}$`, 'i') },
      isActive: true,
    });
    if (!found) throw new NotFoundError(`Category "${categoryId}" not found in this restaurant`);
    categoryId = found._id;
  } else {
    const exists = await MenuCategory.findOne({ _id: categoryId, restaurant: restaurantId });
    if (!exists) throw new NotFoundError('Category not found in this restaurant');
  }

  const item = await MenuItem.create({ restaurant: restaurantId, ...data, category: categoryId });
  await invalidateMenuCache(restaurantId);
  return item;
}

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

async function toggleItemAvailability(itemId, restaurantId) {
  const item = await MenuItem.findOne({ _id: itemId, restaurant: restaurantId });
  if (!item) throw new NotFoundError('Menu item not found');

  item.isAvailable = !item.isAvailable;
  await item.save();
  await invalidateMenuCache(restaurantId);
  return item;
}

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
