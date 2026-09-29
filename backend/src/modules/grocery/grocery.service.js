'use strict';

const mongoose = require('mongoose');
const GroceryCategory = require('./groceryCategory.model');
const GroceryProduct = require('./groceryProduct.model');
const GroceryBanner = require('./groceryBanner.model');
const { NotFoundError, BadRequestError } = require('../../common/errors');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const HOME_CACHE_TTL = 120; // 2 minutes
const CATEGORIES_CACHE_TTL = 300; // 5 minutes

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function invalidateGroceryCache() {
  try {
    const keys = await redis.keys('grocery:*');
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn('[Cache] Grocery cache invalidation failed', { error: err.message });
  }
}

/**
 * Get aggregated home feed (Banners, Categories, Special Deals, Trending items)
 */
async function getGroceryHomeFeed() {
  const cacheKey = 'grocery:home';

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn('[Cache] Grocery home read failed', { error: err.message });
  }

  const [banners, categories, specialDeals, trending] = await Promise.all([
    GroceryBanner.find({ isActive: true }).sort('sortOrder').lean(),
    GroceryCategory.find({ isActive: true }).sort('sortOrder').lean(),
    GroceryProduct.find({
      isActive: true,
      isAvailable: true,
      $or: [{ isSpecialDeal: true }, { badge: 'deal' }],
    })
      .populate('category', 'name slug')
      .sort('sortOrder -createdAt')
      .limit(10)
      .lean(),
    GroceryProduct.find({
      isActive: true,
      isAvailable: true,
      $or: [{ isTrending: true }, { badge: 'best_seller' }],
    })
      .populate('category', 'name slug')
      .sort('sortOrder -rating -ratingCount')
      .limit(12)
      .lean(),
  ]);

  const responseData = {
    banners,
    categories,
    specialDeals,
    trending,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', HOME_CACHE_TTL);
  } catch (err) {
    logger.warn('[Cache] Grocery home write failed', { error: err.message });
  }

  return responseData;
}

/**
 * Get all active categories
 */
async function getCategories(onlyActive = true) {
  const cacheKey = `grocery:categories:${onlyActive ? 'active' : 'all'}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn('[Cache] Grocery categories read failed', { error: err.message });
  }

  const filter = onlyActive ? { isActive: true } : {};
  const categories = await GroceryCategory.find(filter).sort('sortOrder').lean();

  try {
    await redis.set(cacheKey, JSON.stringify(categories), 'EX', CATEGORIES_CACHE_TTL);
  } catch (err) {
    logger.warn('[Cache] Grocery categories write failed', { error: err.message });
  }

  return categories;
}

/**
 * Filtered & paginated product catalog search/filter
 */
async function getProducts(queryParams = {}) {
  const {
    category,
    filter,
    badge,
    minPrice,
    maxPrice,
    sort,
    isOrganic,
    isSpecialDeal,
    isTrending,
    search,
    page = 1,
    limit = 20,
  } = queryParams;

  const mongoQuery = { isActive: true, isAvailable: true };

  // Category filter by ObjectId or Slug
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      mongoQuery.category = category;
    } else {
      const catDoc = await GroceryCategory.findOne({
        $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
      }).select('_id');
      if (catDoc) {
        mongoQuery.category = catDoc._id;
      } else {
        return { products: [], total: 0, totalPages: 0, page, limit };
      }
    }
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    mongoQuery.price = {};
    if (minPrice !== undefined) mongoQuery.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) mongoQuery.price.$lte = Number(maxPrice);
  }

  // Badges and quick filter flags
  if (badge) {
    mongoQuery.badge = badge;
  }

  if (isOrganic) mongoQuery.isOrganic = true;
  if (isSpecialDeal) mongoQuery.isSpecialDeal = true;
  if (isTrending) mongoQuery.isTrending = true;

  if (filter === 'deals') {
    mongoQuery.$or = [{ isSpecialDeal: true }, { badge: 'deal' }];
  } else if (filter === 'organic') {
    mongoQuery.$or = [{ isOrganic: true }, { badge: 'organic' }];
  }

  // Search keyword
  if (search) {
    mongoQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort order determination
  let sortOption = { sortOrder: 1, createdAt: -1 };
  if (sort === 'price_asc' || filter === 'price') {
    sortOption = { price: 1 };
  } else if (sort === 'price_desc') {
    sortOption = { price: -1 };
  } else if (sort === 'popularity' || filter === 'popularity') {
    sortOption = { rating: -1, ratingCount: -1 };
  } else if (sort === 'rating') {
    sortOption = { rating: -1 };
  } else if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    GroceryProduct.find(mongoQuery)
      .populate('category', 'name slug emoji bg')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    GroceryProduct.countDocuments(mongoQuery),
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    page: Number(page),
    limit: Number(limit),
  };
}

/**
 * Get single product by ID or Slug
 */
async function getProductByIdOrSlug(idOrSlug) {
  let product;
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    product = await GroceryProduct.findById(idOrSlug).populate('category', 'name slug emoji bg');
  } else {
    product = await GroceryProduct.findOne({ slug: idOrSlug.toLowerCase() }).populate(
      'category',
      'name slug emoji bg'
    );
  }

  if (!product || !product.isActive) {
    throw new NotFoundError('Grocery product not found');
  }

  return product;
}

/**
 * Autocomplete / fast search
 */
async function searchProducts(query, limit = 10) {
  if (!query || query.trim().length === 0) return [];

  const regex = new RegExp(query.trim(), 'i');
  return GroceryProduct.find({
    isActive: true,
    isAvailable: true,
    $or: [{ name: regex }, { tags: { $in: [regex] } }],
  })
    .select('name slug price originalPrice unit images badge rating discount')
    .limit(Number(limit))
    .lean();
}

/**
 * Admin: Category Management
 */
async function createCategory(data) {
  const slug = data.slug || slugify(data.name);
  const existing = await GroceryCategory.findOne({ slug });
  if (existing) {
    throw new BadRequestError(`Category with slug "${slug}" already exists`);
  }

  const category = await GroceryCategory.create({ ...data, slug });
  await invalidateGroceryCache();
  return category;
}

async function updateCategory(id, updates) {
  if (updates.name && !updates.slug) {
    updates.slug = slugify(updates.name);
  }

  const category = await GroceryCategory.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!category) throw new NotFoundError('Category not found');
  await invalidateGroceryCache();
  return category;
}

async function deleteCategory(id) {
  const category = await GroceryCategory.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!category) throw new NotFoundError('Category not found');
  await invalidateGroceryCache();
  return { message: 'Category deactivated successfully' };
}

/**
 * Admin: Product Management
 */
async function createProduct(data) {
  let categoryId = data.category;
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const foundCat = await GroceryCategory.findOne({
      $or: [{ slug: categoryId.toLowerCase() }, { name: new RegExp(`^${categoryId}$`, 'i') }],
    });
    if (!foundCat) throw new NotFoundError(`Category "${categoryId}" not found`);
    categoryId = foundCat._id;
  } else {
    const exists = await GroceryCategory.findById(categoryId);
    if (!exists) throw new NotFoundError('Category not found');
  }

  const slug = data.slug || slugify(data.name) + '-' + Date.now().toString().slice(-4);

  const product = await GroceryProduct.create({
    ...data,
    category: categoryId,
    slug,
  });

  await invalidateGroceryCache();
  return product;
}

async function updateProduct(id, updates) {
  if (updates.category && !mongoose.Types.ObjectId.isValid(updates.category)) {
    const foundCat = await GroceryCategory.findOne({
      $or: [{ slug: updates.category.toLowerCase() }, { name: new RegExp(`^${updates.category}$`, 'i') }],
    });
    if (!foundCat) throw new NotFoundError(`Category "${updates.category}" not found`);
    updates.category = foundCat._id;
  }

  const product = await GroceryProduct.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug emoji bg');

  if (!product) throw new NotFoundError('Product not found');
  await invalidateGroceryCache();
  return product;
}

async function toggleProductAvailability(id) {
  const product = await GroceryProduct.findById(id);
  if (!product) throw new NotFoundError('Product not found');

  product.isAvailable = !product.isAvailable;
  await product.save();
  await invalidateGroceryCache();
  return product;
}

async function deleteProduct(id) {
  const product = await GroceryProduct.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!product) throw new NotFoundError('Product not found');
  await invalidateGroceryCache();
  return { message: 'Product deleted successfully' };
}

/**
 * Admin: Banner Management
 */
async function createBanner(data) {
  const banner = await GroceryBanner.create(data);
  await invalidateGroceryCache();
  return banner;
}

async function getBanners(onlyActive = true) {
  const filter = onlyActive ? { isActive: true } : {};
  return GroceryBanner.find(filter).sort('sortOrder').lean();
}

async function updateBanner(id, updates) {
  const banner = await GroceryBanner.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!banner) throw new NotFoundError('Banner not found');
  await invalidateGroceryCache();
  return banner;
}

async function deleteBanner(id) {
  const banner = await GroceryBanner.findByIdAndDelete(id);
  if (!banner) throw new NotFoundError('Banner not found');
  await invalidateGroceryCache();
  return { message: 'Banner removed successfully' };
}

module.exports = {
  getGroceryHomeFeed,
  getCategories,
  getProducts,
  getProductByIdOrSlug,
  searchProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
};
