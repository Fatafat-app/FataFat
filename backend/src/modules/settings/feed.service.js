'use strict';

const HomeConfig = require('./homeConfig.model');
const Banner = require('../banners/banner.model');
const searchService = require('../search/search.service');
const { catalogService } = require('../catalog');
const groceryService = require('../grocery/grocery.service');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const FEED_CACHE_TTL = 60; // 60 seconds

function getFeedCacheKey(isVeg, lat, lng) {
  const latKey = !isNaN(parseFloat(lat)) ? Math.round(parseFloat(lat) * 100) : 'def';
  const lngKey = !isNaN(parseFloat(lng)) ? Math.round(parseFloat(lng) * 100) : 'def';
  return `feed:home:${isVeg ? 'veg' : 'all'}:${latKey}_${lngKey}`;
}

async function invalidateFeedCache() {
  try {
    const keys = await redis.keys('feed:home:*');
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn('[Cache] Feed cache invalidation failed', { error: err.message });
  }
}

function cleanText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanConfig(config) {
  if (!config || !config.sections) return config;
  const sections = {};
  for (const [k, s] of Object.entries(config.sections)) {
    sections[k] = {
      ...s,
      title: cleanText(s.title),
      subtitle: cleanText(s.subtitle),
    };
  }
  return { ...config, sections };
}

async function getHomeConfig() {
  let config = await HomeConfig.findOne({ key: 'default' }).lean();
  if (!config) {
    config = await HomeConfig.create({ key: 'default' });
    config = config.toObject ? config.toObject() : config;
  }
  return cleanConfig(config);
}

async function updateHomeConfig(sectionsData, userId) {
  let config = await HomeConfig.findOne({ key: 'default' });
  if (!config) {
    config = new HomeConfig({ key: 'default' });
  }

  if (sectionsData) {
    for (const [key, val] of Object.entries(sectionsData)) {
      if (config.sections[key]) {
        if (typeof val.enabled === 'boolean') config.sections[key].enabled = val.enabled;
        if (typeof val.title === 'string' && val.title.trim()) config.sections[key].title = cleanText(val.title.trim());
        if (typeof val.subtitle === 'string') config.sections[key].subtitle = cleanText(val.subtitle.trim());
        if (typeof val.limit === 'number' && val.limit > 0) config.sections[key].limit = val.limit;
        if (typeof val.sortOrder === 'number') config.sections[key].sortOrder = val.sortOrder;
      }
    }
  }

  if (userId) {
    config.updatedBy = userId;
  }

  await config.save();
  await invalidateFeedCache();
  const obj = config.toObject ? config.toObject() : config;
  return cleanConfig(obj);
}

async function getUnifiedHomeFeed({ lat, lng, isVeg = false }) {
  const cacheKey = getFeedCacheKey(isVeg, lat, lng);

  // 1. Check Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore cache error
  }

  // 2. Load admin config
  const config = await getHomeConfig();
  const sec = config.sections || {};

  // 3. Parallel lean fetches
  const isVegBool = isVeg === true || isVeg === 'true';

  const [
    heroBannersRes,
    categoriesRes,
    recommendedRes,
    stealDealsRes,
    under99Res,
    restaurantsRes,
    trendingRes,
    frequentlyBoughtRes,
    spotlightRes,
    mustTryRes,
  ] = await Promise.all([
    // Hero Banners
    sec.heroBanners?.enabled !== false
      ? Banner.find({ section: 'FOOD_HERO', isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
      : Promise.resolve([]),

    // Categories (What's on your mind)
    sec.categories?.enabled !== false
      ? catalogService.getCategories().then((cats) => cats.slice(0, sec.categories?.limit || 12)).catch(() => [])
      : Promise.resolve([]),

    // Recommended for You
    sec.recommended?.enabled !== false
      ? searchService.getRecommendedItems({ isVeg: isVegBool, limit: sec.recommended?.limit || 15 }).then((r) => r.items || []).catch(() => [])
      : Promise.resolve([]),

    // Steal Deals (Offers for You)
    sec.stealDeals?.enabled !== false
      ? Banner.find({ section: 'OFFERS_FOR_YOU', isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
      : Promise.resolve([]),

    // 99 Store
    sec.under99?.enabled !== false
      ? searchService.getUnder99Items({ isVeg: isVegBool, limit: sec.under99?.limit || 18 }).then((r) => r.items || []).catch(() => [])
      : Promise.resolve([]),

    // Restaurants Near You
    sec.restaurants?.enabled !== false
      ? searchService.searchRestaurants('', { lat, lng, radiusKm: 50 }, { isVeg: isVegBool, limit: sec.restaurants?.limit || 10 }).then((r) => r.restaurants || []).catch(() => [])
      : Promise.resolve([]),

    // Trending Dishes
    sec.trending?.enabled !== false
      ? searchService.getTrendingItems({ isVeg: isVegBool, limit: sec.trending?.limit || 15 }).then((r) => r.items || []).catch(() => [])
      : Promise.resolve([]),

    // Frequently Bought (Grocery)
    sec.frequentlyBought?.enabled !== false
      ? groceryService.getProducts({ sort: 'popularity', limit: sec.frequentlyBought?.limit || 10 }).then((r) => r.products || []).catch(() => [])
      : Promise.resolve([]),

    // Spotlight Deals
    sec.spotlight?.enabled !== false
      ? Banner.find({ section: 'SPOTLIGHT', isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean()
      : Promise.resolve([]),

    // Must-Try Products
    sec.mustTry?.enabled !== false
      ? searchService.searchMenuItems('', { limit: sec.mustTry?.limit || 15, isVeg: isVegBool }).then((r) => r.items || []).catch(() => [])
      : Promise.resolve([]),
  ]);

  const payload = {
    config: sec,
    heroBanners: heroBannersRes || [],
    categories: categoriesRes || [],
    recommended: recommendedRes || [],
    stealDeals: stealDealsRes || [],
    under99: under99Res || [],
    restaurants: restaurantsRes || [],
    trending: trendingRes || [],
    frequentlyBought: frequentlyBoughtRes || [],
    spotlight: spotlightRes || [],
    mustTry: mustTryRes || [],
    timestamp: Date.now(),
  };

  // 4. Save to Redis
  try {
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', FEED_CACHE_TTL);
  } catch {
    // Ignore cache error
  }

  return payload;
}

module.exports = {
  getHomeConfig,
  updateHomeConfig,
  getUnifiedHomeFeed,
  invalidateFeedCache,
};
