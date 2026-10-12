'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../../src/config/env');
const Cuisine = require('../../src/modules/masters/cuisine.model');
const DietaryType = require('../../src/modules/masters/dietaryType.model');
const CancellationReason = require('../../src/modules/masters/cancellationReason.model');
const Category = require('../../src/modules/catalog/category.model');
const Restaurant = require('../../src/modules/restaurants/restaurant.model');
const MenuItem = require('../../src/modules/menu/menuItem.model');
const FeeConfig = require('../../src/modules/admin/feeConfig.model');

const CANONICAL_CUISINES = [
  { code: 'NORTH_INDIAN', name: 'North Indian', isPopular: true, sortOrder: 1, coverImage: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg' },
  { code: 'SOUTH_INDIAN', name: 'South Indian', isPopular: true, sortOrder: 2, coverImage: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg' },
  { code: 'BIRYANI', name: 'Biryani', isPopular: true, sortOrder: 3, coverImage: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
  { code: 'FAST_FOOD', name: 'Fast Food', isPopular: true, sortOrder: 4, coverImage: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
  { code: 'CHINESE', name: 'Chinese', isPopular: true, sortOrder: 5, coverImage: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  { code: 'ITALIAN', name: 'Italian', isPopular: true, sortOrder: 6, coverImage: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
  { code: 'PIZZA', name: 'Pizza', isPopular: true, sortOrder: 7, coverImage: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
  { code: 'BURGERS', name: 'Burgers', isPopular: true, sortOrder: 8, coverImage: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
  { code: 'MUGHLAI', name: 'Mughlai', isPopular: true, sortOrder: 9, coverImage: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg' },
  { code: 'DESSERTS', name: 'Desserts', isPopular: true, sortOrder: 10, coverImage: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg' },
  { code: 'BEVERAGES', name: 'Beverages', isPopular: true, sortOrder: 11, coverImage: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' },
  { code: 'ROLLS', name: 'Rolls', isPopular: false, sortOrder: 12, coverImage: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg' },
  { code: 'STREET_FOOD', name: 'Street Food', isPopular: false, sortOrder: 13, coverImage: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg' },
  { code: 'THALI', name: 'Thali', isPopular: false, sortOrder: 14, coverImage: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg' },
  { code: 'CONTINENTAL', name: 'Continental', isPopular: false, sortOrder: 15, coverImage: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg' },
];

const CANONICAL_DIETARY_TYPES = [
  { code: 'VEG', name: 'Vegetarian', colorCode: '#059669', badgeIcon: 'leaf', isVeg: true, sortOrder: 1, description: '100% pure vegetarian dish' },
  { code: 'NON_VEG', name: 'Non-Vegetarian', colorCode: '#DC2626', badgeIcon: 'restaurant', isVeg: false, sortOrder: 2, description: 'Contains meat, poultry, or seafood' },
  { code: 'VEGAN', name: 'Vegan', colorCode: '#16A34A', badgeIcon: 'nutrition', isVeg: true, sortOrder: 3, description: 'Plant-based with no dairy or animal products' },
  { code: 'EGGETARIAN', name: 'Eggitarian', colorCode: '#D97706', badgeIcon: 'egg', isVeg: false, sortOrder: 4, description: 'Vegetarian dish containing eggs' },
  { code: 'JAIN', name: 'Jain Vegetarian', colorCode: '#0D9488', badgeIcon: 'shield-checkmark', isVeg: true, sortOrder: 5, description: 'Pure vegetarian prepared without root vegetables' },
];

const CANONICAL_CANCELLATION_REASONS = [
  // Customer
  { code: 'ORDERED_BY_MISTAKE', name: 'Ordered by mistake', role: 'customer', sortOrder: 1, triggersAutoRefund: true },
  { code: 'DELIVERY_TIME_TOO_LONG', name: 'Delivery time is too long', role: 'customer', sortOrder: 2, triggersAutoRefund: true },
  { code: 'CHANGE_DELIVERY_ADDRESS', name: 'Need to change delivery address', role: 'customer', sortOrder: 3, triggersAutoRefund: true },
  { code: 'FORGOT_TO_ADD_ITEMS', name: 'Forgot to add items to order', role: 'customer', sortOrder: 4, triggersAutoRefund: true },
  { code: 'OTHER_CUSTOMER', name: 'Other reason', role: 'customer', sortOrder: 5, requiresRemarks: true, triggersAutoRefund: false },
  // Restaurant
  { code: 'ITEM_OUT_OF_STOCK', name: 'Items out of stock', role: 'restaurant', sortOrder: 1, triggersAutoRefund: true },
  { code: 'KITCHEN_OVERLOADED', name: 'Kitchen overloaded with orders', role: 'restaurant', sortOrder: 2, triggersAutoRefund: true },
  { code: 'RESTAURANT_CLOSING', name: 'Restaurant closing for the day', role: 'restaurant', sortOrder: 3, triggersAutoRefund: true },
  { code: 'PRICING_ERROR', name: 'Menu pricing error', role: 'restaurant', sortOrder: 4, triggersAutoRefund: true },
  { code: 'OTHER_RESTAURANT', name: 'Other reason', role: 'restaurant', sortOrder: 5, requiresRemarks: true, triggersAutoRefund: true },
  // Rider
  { code: 'VEHICLE_BREAKDOWN', name: 'Vehicle breakdown or issue', role: 'rider', sortOrder: 1, triggersAutoRefund: true },
  { code: 'UNREACHABLE_CUSTOMER', name: 'Customer unreachable at address', role: 'rider', sortOrder: 2, triggersAutoRefund: false },
  { code: 'EXTREME_WEATHER', name: 'Extreme weather or flood', role: 'rider', sortOrder: 3, triggersAutoRefund: true },
  // Admin
  { code: 'FRAUD_PREVENTION', name: 'Fraud or security prevention', role: 'admin', sortOrder: 1, triggersAutoRefund: true },
  { code: 'SYSTEM_ISSUE', name: 'Platform technical issue', role: 'admin', sortOrder: 2, triggersAutoRefund: true },
];

const CANONICAL_CATEGORIES = [
  { code: 'PIZZA', name: 'Pizza', slug: 'pizza', iconUrl: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', sortOrder: 1 },
  { code: 'BURGER', name: 'Burger', slug: 'burger', iconUrl: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', sortOrder: 2 },
  { code: 'BIRYANI', name: 'Biryani', slug: 'biryani', iconUrl: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg', sortOrder: 3 },
  { code: 'PARATHA', name: 'Paratha', slug: 'paratha', iconUrl: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg', sortOrder: 4 },
  { code: 'NOODLES', name: 'Noodles', slug: 'noodles', iconUrl: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg', sortOrder: 5 },
  { code: 'DESSERTS', name: 'Desserts', slug: 'desserts', iconUrl: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg', sortOrder: 6 },
  { code: 'ROLLS', name: 'Rolls', slug: 'rolls', iconUrl: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg', sortOrder: 7 },
  { code: 'THALI', name: 'Thali', slug: 'thali', iconUrl: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg', sortOrder: 8 },
  { code: 'COFFEE_TEA', name: 'Coffee / Tea', slug: 'coffee-tea', iconUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg', sortOrder: 9 },
  { code: 'ICE_CREAM', name: 'Ice Cream', slug: 'ice-cream', iconUrl: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg', sortOrder: 10 },
];

async function runMigration() {
  console.log('🚀 Starting Master Data Migration...');
  await mongoose.connect(env.db.uri);
  console.log(' Connected to MongoDB.');

  // 1. Upsert Cuisines
  console.log('\n📦 [1/6] Upserting Canonical Cuisines...');
  const cuisineMap = new Map();
  for (const c of CANONICAL_CUISINES) {
    const doc = await Cuisine.findOneAndUpdate(
      { code: c.code },
      { $set: { ...c, isActive: true } },
      { upsert: true, new: true }
    );
    cuisineMap.set(c.code, doc);
    cuisineMap.set(c.name.toLowerCase(), doc);
  }
  console.log(`✓ Upserted ${CANONICAL_CUISINES.length} Cuisines.`);

  // 2. Upsert Dietary Types
  console.log('\n🥗 [2/6] Upserting Canonical Dietary Types...');
  const dietaryMap = new Map();
  for (const dt of CANONICAL_DIETARY_TYPES) {
    const doc = await DietaryType.findOneAndUpdate(
      { code: dt.code },
      { $set: { ...dt, isActive: true } },
      { upsert: true, new: true }
    );
    dietaryMap.set(dt.code, doc);
  }
  console.log(`✓ Upserted ${CANONICAL_DIETARY_TYPES.length} Dietary Types.`);

  // 3. Upsert Cancellation Reasons
  console.log('\n🚫 [3/6] Upserting Canonical Cancellation Reasons...');
  for (const cr of CANONICAL_CANCELLATION_REASONS) {
    await CancellationReason.findOneAndUpdate(
      { code: cr.code },
      { $set: { ...cr, isActive: true } },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Upserted ${CANONICAL_CANCELLATION_REASONS.length} Cancellation Reasons.`);

  // 4. Upsert Food Categories
  console.log('\n📂 [4/6] Upserting Canonical Food Categories...');
  for (const cat of CANONICAL_CATEGORIES) {
    await Category.findOneAndUpdate(
      { code: cat.code },
      { $set: { ...cat, image: cat.iconUrl, order: cat.sortOrder, isActive: true, vertical: 'food' } },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Upserted ${CANONICAL_CATEGORIES.length} Food Categories.`);

  // 5. Migrate Restaurants: Map string cuisines -> cuisineIds ObjectIds
  console.log('\n🏪 [5/6] Migrating Restaurants to cuisineIds references...');
  const restaurants = await Restaurant.find();
  let restaurantsUpdated = 0;

  for (const rest of restaurants) {
    const matchedIds = [];
    const rawCuisines = rest.cuisines || [];

    for (const rawName of rawCuisines) {
      const normalizedKey = rawName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      let matchedDoc = cuisineMap.get(normalizedKey) || cuisineMap.get(rawName.trim().toLowerCase());

      // If not in canonical list, dynamically register it
      if (!matchedDoc && rawName.trim()) {
        const newCode = normalizedKey || 'CUSTOM_CUISINE';
        matchedDoc = await Cuisine.findOneAndUpdate(
          { code: newCode },
          { $set: { code: newCode, name: rawName.trim(), isActive: true } },
          { upsert: true, new: true }
        );
        cuisineMap.set(newCode, matchedDoc);
        cuisineMap.set(rawName.trim().toLowerCase(), matchedDoc);
      }

      if (matchedDoc && !matchedIds.some((id) => id.equals(matchedDoc._id))) {
        matchedIds.push(matchedDoc._id);
      }
    }

    if (matchedIds.length > 0) {
      rest.cuisineIds = matchedIds;
      await rest.save();
      restaurantsUpdated++;
    }
  }
  console.log(`✓ Migrated ${restaurantsUpdated} / ${restaurants.length} Restaurants.`);

  // 6. Migrate Menu Items: Map isVeg -> dietaryTypeId
  console.log('\n🍽️ [6/6] Migrating Menu Items to dietaryTypeId references...');
  const vegType = dietaryMap.get('VEG');
  const nonVegType = dietaryMap.get('NON_VEG');

  const menuItems = await MenuItem.find();
  let menuItemsUpdated = 0;

  for (const item of menuItems) {
    const targetType = item.isVeg ? vegType : nonVegType;
    if (targetType) {
      item.dietaryTypeId = targetType._id;
      await item.save();
      menuItemsUpdated++;
    }
  }
  console.log(`✓ Migrated ${menuItemsUpdated} / ${menuItems.length} Menu Items.`);

  // 7. Ensure FeeConfig
  let feeCfg = await FeeConfig.findOne({ key: 'GLOBAL_FEES' });
  if (!feeCfg) {
    await FeeConfig.create({
      key: 'GLOBAL_FEES',
      platformFee: 500,
      baseDeliveryFee: 3000,
      packagingFee: 1500,
      taxPercent: 5,
    });
    console.log('✓ Initialized default FeeConfig.');
  }

  console.log('\n🎉 ==============================================');
  console.log('🎉 MASTER DATA MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('🎉 ==============================================\n');

  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
