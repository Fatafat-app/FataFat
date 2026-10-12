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

async function resolveOrCreateCategory(restaurantId, categoryInput) {
  if (!categoryInput) return null;
  const inputStr = categoryInput.toString().trim();

  if (mongoose.Types.ObjectId.isValid(inputStr)) {
    const exists = await MenuCategory.findOne({ _id: inputStr, restaurant: restaurantId });
    if (exists) return exists._id;
  }

  // Look up by name (case-insensitive)
  const escapedName = inputStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let found = await MenuCategory.findOne({
    restaurant: restaurantId,
    name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
  });

  if (found) {
    if (!found.isActive) {
      found.isActive = true;
      await found.save();
    }
    return found._id;
  }

  // Auto-create category for restaurant if not found
  const newCat = await MenuCategory.create({
    restaurant: restaurantId,
    name: inputStr,
    isActive: true,
  });
  return newCat._id;
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
    { returnDocument: 'after', runValidators: true }
  );

  if (!category) throw new NotFoundError('Category not found');
  await invalidateMenuCache(restaurantId);
  return category;
}

async function addMenuItem(restaurantId, data) {
  const categoryId = await resolveOrCreateCategory(restaurantId, data.category);

  const item = await MenuItem.create({
    restaurant: restaurantId,
    ...data,
    category: categoryId,
  });
  await invalidateMenuCache(restaurantId);
  return item;
}

async function updateMenuItem(itemId, restaurantId, updates) {
  const updateData = { ...updates };

  if (updateData.category) {
    updateData.category = await resolveOrCreateCategory(restaurantId, updateData.category);
  }

  const item = await MenuItem.findOneAndUpdate(
    { _id: itemId, restaurant: restaurantId },
    updateData,
    { returnDocument: 'after', runValidators: true }
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

async function deleteMenuItem(itemId, restaurantId) {
  const query = { _id: itemId };
  if (restaurantId) query.restaurant = restaurantId;
  const item = await MenuItem.findOneAndDelete(query);
  if (!item) throw new NotFoundError('Menu item not found');
  await invalidateMenuCache(item.restaurant || restaurantId);
  return item;
}

async function deleteCategory(categoryId, restaurantId) {
  const query = { _id: categoryId };
  if (restaurantId) query.restaurant = restaurantId;
  const category = await MenuCategory.findOneAndDelete(query);
  if (!category) throw new NotFoundError('Category not found');
  await MenuItem.deleteMany({ category: categoryId, restaurant: category.restaurant || restaurantId });
  await invalidateMenuCache(category.restaurant || restaurantId);
  return category;
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
  deleteCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  getMenuItem,
};
