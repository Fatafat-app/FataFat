'use strict';

const Banner = require('./banner.model');
const { NotFoundError } = require('../../common/errors');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const BANNER_CACHE_TTL = 60; // 1 min

function bannerCacheKey(section) {
  return `banners:${section || 'ALL'}`;
}

async function invalidateBannerCache(section) {
  try {
    const keys = [`banners:ALL`, `banners:FOOD_HERO`, `banners:OFFERS_FOR_YOU`, `banners:SPOTLIGHT`, `banners:GROCERY_HERO`, `grocery:home`];
    await redis.del(...keys);
  } catch (err) {
    logger.warn('[Cache] Banner cache invalidation failed', { error: err.message });
  }
}

const DEFAULT_FOOD_HERO = [
  {
    tag: 'LIMITED TIME',
    title: 'Midnight',
    subtitle: 'Cravings?',
    description: 'Hot & fresh food delivered in 20 mins flat.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    colors: ['#0D9488', '#0F766E'],
    textColor: '#FFFFFF',
    accentColor: '#CCFBF1',
    actionText: 'Order Now',
    section: 'FOOD_HERO',
    targetType: 'search',
    targetId: 'Pizza',
    sortOrder: 1,
    isActive: true,
  },
  {
    tag: 'EXCLUSIVE',
    title: 'Flat 50%',
    subtitle: 'OFF TODAY',
    description: 'On your favorite pizzas and local meals.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    colors: ['#F59E0B', '#D97706'],
    textColor: '#1A1A1F',
    accentColor: '#FEF3C7',
    actionText: 'Claim Offer',
    section: 'FOOD_HERO',
    targetType: 'coupon',
    targetId: 'FLAT50',
    sortOrder: 2,
    isActive: true,
  },
  {
    tag: 'HOT & SPICY',
    title: 'Desi',
    subtitle: 'Flavors',
    description: 'Authentic Indian curries & tandoori specials.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    colors: ['#EA580C', '#C2410C'],
    textColor: '#FFFFFF',
    accentColor: '#FFEDD5',
    actionText: 'Spice it Up',
    section: 'FOOD_HERO',
    targetType: 'cuisine',
    targetId: 'North Indian',
    sortOrder: 3,
    isActive: true,
  },
  {
    tag: 'FESTIVE',
    title: 'Maha',
    subtitle: 'Thali',
    description: 'Enjoy our grand veg thali with family & friends.',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80',
    colors: ['#F97316', '#EA580C'],
    textColor: '#FFFFFF',
    accentColor: '#FFF7ED',
    actionText: 'Feast Now',
    section: 'FOOD_HERO',
    targetType: 'search',
    targetId: 'Thali',
    sortOrder: 4,
    isActive: true,
  },
  {
    tag: 'HEALTHY',
    title: 'Fresh',
    subtitle: 'Salads',
    description: 'Crafted for your healthy lifestyle & diet.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    colors: ['#10B981', '#059669'],
    textColor: '#FFFFFF',
    accentColor: '#D1FAE5',
    actionText: 'View Menu',
    section: 'FOOD_HERO',
    targetType: 'search',
    targetId: 'Healthy',
    sortOrder: 5,
    isActive: true,
  },
  {
    tag: 'DESSERTS',
    title: 'Sweet',
    subtitle: 'Tooth?',
    description: 'Buy 1 Get 1 on all premium desserts.',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    colors: ['#6366F1', '#4F46E5'],
    textColor: '#FFFFFF',
    accentColor: '#E0E7FF',
    actionText: 'Grab Now',
    section: 'FOOD_HERO',
    targetType: 'search',
    targetId: 'Dessert',
    sortOrder: 6,
    isActive: true,
  },
];

const DEFAULT_OFFERS = [
  {
    tag: 'FLAT DEAL',
    title: '50% OFF',
    subtitle: 'on your favourite food',
    description: 'Valid on orders above ₹199 across top restaurants.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    colors: ['#0D9488', '#0F766E'],
    textColor: '#FFFFFF',
    accentColor: 'rgba(255,255,255,0.2)',
    actionText: 'Order Now',
    section: 'OFFERS_FOR_YOU',
    targetType: 'search',
    targetId: 'Pizza',
    sortOrder: 1,
    isActive: true,
  },
  {
    tag: 'MEGA OFFER',
    title: 'Buy 1 Get 1',
    subtitle: 'on selected desserts',
    description: 'Double the sweetness with exclusive bakery deals.',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80',
    colors: ['#F59E0B', '#D97706'],
    textColor: '#FFFFFF',
    accentColor: 'rgba(255,255,255,0.2)',
    actionText: 'Claim BOGO',
    section: 'OFFERS_FOR_YOU',
    targetType: 'search',
    targetId: 'Dessert',
    sortOrder: 2,
    isActive: true,
  },
  {
    tag: 'HEALTHY',
    title: '30% OFF',
    subtitle: 'on fresh salads',
    description: 'Healthy and organic meal bowls delivered fresh.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    colors: ['#E11D48', '#BE123C'],
    textColor: '#FFFFFF',
    accentColor: 'rgba(255,255,255,0.2)',
    actionText: 'Eat Healthy',
    section: 'OFFERS_FOR_YOU',
    targetType: 'search',
    targetId: 'Healthy',
    sortOrder: 3,
    isActive: true,
  },
];

const DEFAULT_SPOTLIGHT = [
  {
    tag: 'BESTSELLER',
    title: 'Royal Biryani Co.',
    subtitle: 'Up to 40% OFF',
    description: 'Dum cooked handi biryani with fragrant spices',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
    colors: ['#000000', '#1F2937'],
    textColor: '#FFFFFF',
    accentColor: '#F59E0B',
    actionText: 'Explore Menu',
    section: 'SPOTLIGHT',
    targetType: 'search',
    targetId: 'Biryani',
    sortOrder: 1,
    isActive: true,
  },
  {
    tag: 'TRENDING',
    title: 'Artisan Burger Hub',
    subtitle: 'Flat ₹100 OFF',
    description: 'Juicy smashed patties & crispy loaded fries',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    colors: ['#000000', '#1F2937'],
    textColor: '#FFFFFF',
    accentColor: '#EF4444',
    actionText: 'Grab Deal',
    section: 'SPOTLIGHT',
    targetType: 'search',
    targetId: 'Burger',
    sortOrder: 2,
    isActive: true,
  },
  {
    tag: 'MUST TRY',
    title: 'Pizza Romana',
    subtitle: 'Buy 1 Get 1 Free',
    description: 'Woodfired sourdough crust with buffalo mozzarella',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    colors: ['#000000', '#1F2937'],
    textColor: '#FFFFFF',
    accentColor: '#10B981',
    actionText: 'Order Pizza',
    section: 'SPOTLIGHT',
    targetType: 'search',
    targetId: 'Pizza',
    sortOrder: 3,
    isActive: true,
  },
  {
    tag: 'SPECIAL',
    title: 'Dessert Dreams',
    subtitle: 'Sweet Tooth Treat',
    description: 'Gourmet waffles, churros & Belgian chocolate cakes',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    colors: ['#000000', '#1F2937'],
    textColor: '#FFFFFF',
    accentColor: '#8B5CF6',
    actionText: 'Taste Sweet',
    section: 'SPOTLIGHT',
    targetType: 'search',
    targetId: 'Dessert',
    sortOrder: 4,
    isActive: true,
  },
];

const DEFAULT_GROCERY_HERO = [
  {
    tag: 'FARM FRESH',
    title: 'Ftafat Fresh 🥦',
    subtitle: 'Farm to Door',
    description: 'Fresh organic vegetables & fruits in 10 mins!',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    colors: ['#E6F4EA', '#CEEAD6'],
    textColor: '#1E3D34',
    accentColor: '#34A853',
    actionText: 'Shop Fresh',
    section: 'GROCERY_HERO',
    targetType: 'search',
    targetId: 'Vegetables',
    sortOrder: 1,
    isActive: true,
  },
  {
    tag: 'MEGA SAVINGS',
    title: 'Ftafat Mart 🏠',
    subtitle: 'Mega Deals',
    description: 'Up to 50% OFF on daily household essentials.',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    colors: ['#FCE8E6', '#FAD2CF'],
    textColor: '#B31412',
    accentColor: '#EA4335',
    actionText: 'Grab Deals',
    section: 'GROCERY_HERO',
    targetType: 'search',
    targetId: 'Household',
    sortOrder: 2,
    isActive: true,
  },
  {
    tag: 'MORNING FRESH',
    title: 'Ftafat Dairy 🥛',
    subtitle: 'Pure & Organic',
    description: 'Daily essentials delivered before you wake up.',
    image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=800&q=80',
    colors: ['#E8F0FE', '#D2E3FC'],
    textColor: '#174EA6',
    accentColor: '#4285F4',
    actionText: 'Order Dairy',
    section: 'GROCERY_HERO',
    targetType: 'search',
    targetId: 'Dairy',
    sortOrder: 3,
    isActive: true,
  },
  {
    tag: 'PARTY READY',
    title: 'Ftafat Snacks 🍟',
    subtitle: 'Cravings Satisfied',
    description: 'Cold drinks, namkeen & chips delivered instantly.',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80',
    colors: ['#FEF7E0', '#FEEFC3'],
    textColor: '#B06000',
    accentColor: '#FBBC04',
    actionText: 'Munch Now',
    section: 'GROCERY_HERO',
    targetType: 'search',
    targetId: 'Snacks',
    sortOrder: 4,
    isActive: true,
  },
];

async function seedDefaultBannersIfEmpty() {
  try {
    const count = await Banner.countDocuments();
    if (count === 0) {
      await Banner.insertMany([
        ...DEFAULT_FOOD_HERO,
        ...DEFAULT_OFFERS,
        ...DEFAULT_SPOTLIGHT,
        ...DEFAULT_GROCERY_HERO,
      ]);
      logger.info('[Banners] Seeded initial default hero, offer, spotlight & grocery banners');
    }
  } catch (err) {
    logger.warn('[Banners] Seeding banners failed', { error: err.message });
  }
}

async function getBanners(section, onlyActive = true) {
  const cacheKey = bannerCacheKey(section);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Ignore cache error
  }

  const query = {};
  if (section && section !== 'ALL') {
    query.section = section;
  }
  if (onlyActive) {
    query.isActive = true;
  }

  let banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();

  if (banners.length === 0 && section && section !== 'ALL') {
    // Seed this specific section if missing
    if (section === 'SPOTLIGHT') {
      await Banner.insertMany(DEFAULT_SPOTLIGHT);
      banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    } else if (section === 'GROCERY_HERO') {
      await Banner.insertMany(DEFAULT_GROCERY_HERO);
      banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    } else if (section === 'OFFERS_FOR_YOU') {
      await Banner.insertMany(DEFAULT_OFFERS);
      banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    } else if (section === 'FOOD_HERO') {
      await Banner.insertMany(DEFAULT_FOOD_HERO);
      banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    }
  }

  try {
    await redis.set(cacheKey, JSON.stringify(banners), 'EX', BANNER_CACHE_TTL);
  } catch {
    // Ignore cache error
  }

  return banners;
}

async function getAllBannersAdmin(section) {
  const query = {};
  if (section && section !== 'ALL') {
    query.section = section;
  }
  return Banner.find(query).sort({ section: 1, sortOrder: 1, createdAt: -1 }).lean();
}

async function createBanner(data) {
  if (data.sortOrder === undefined) {
    const maxOrder = await Banner.findOne({ section: data.section || 'FOOD_HERO' })
      .sort('-sortOrder')
      .select('sortOrder')
      .lean();
    data.sortOrder = (maxOrder?.sortOrder || 0) + 1;
  }

  const banner = await Banner.create(data);
  await invalidateBannerCache(data.section);
  return banner;
}

async function updateBanner(id, updates) {
  const banner = await Banner.findByIdAndUpdate(id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!banner) throw new NotFoundError('Banner not found');
  await invalidateBannerCache(banner.section);
  return banner;
}

async function deleteBanner(id) {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new NotFoundError('Banner not found');
  await invalidateBannerCache(banner.section);
  return { message: 'Banner deleted successfully' };
}

async function reorderBanners(orderedItems) {
  if (!Array.isArray(orderedItems)) return;
  const bulkOps = orderedItems.map((item, index) => ({
    updateOne: {
      filter: { _id: item.id || item._id },
      update: { $set: { sortOrder: index + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await Banner.bulkWrite(bulkOps);
    await invalidateBannerCache();
  }
}

module.exports = {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  seedDefaultBannersIfEmpty,
};
