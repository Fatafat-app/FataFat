'use strict';

/**
 * scripts/seed.js — Development database seeder.
 *
 * Populates MongoDB with demo data for testing without manual setup:
 * - Admin, Restaurant Owner, Delivery Partner, Customer accounts
 * - Restaurants with geo coordinates (e.g. Connaught Place, New Delhi)
 * - Menu categories & items with realistic pricing (in paise)
 * - Active Coupons
 * - Test Delivery Partner with vehicle details
 *
 * Usage:
 *   node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const env = require('../src/config/env');
const User = require('../src/modules/users/user.model');
const Restaurant = require('../src/modules/restaurants/restaurant.model');
const MenuCategory = require('../src/modules/menu/menuCategory.model');
const MenuItem = require('../src/modules/menu/menuItem.model');
const Coupon = require('../src/modules/coupons/coupon.model');
const DeliveryPartner = require('../src/modules/delivery/delivery.model');
const ROLES = require('../src/common/constants/roles');

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(env.db.uri);
  console.log(' Connected. Cleaning existing database records...');

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    Coupon.deleteMany({}),
    DeliveryPartner.deleteMany({}),
  ]);

  console.log(' Cleared collections.');

  // 1. Create Users
  console.log('👤 Seeding Users...');
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const admin = await User.create({
    name: 'Platform Admin',
    phone: '+919999999999',
    email: 'admin@ftafat.com',
    passwordHash,
    role: ROLES.ADMIN,
    isVerified: true,
  });

  const owner = await User.create({
    name: 'Rajesh Sharma',
    phone: '+919876543210',
    email: 'rajesh@pizzaparadise.com',
    passwordHash,
    role: ROLES.RESTAURANT_OWNER,
    isVerified: true,
  });

  const riderUser = await User.create({
    name: 'Amit Kumar',
    phone: '+919811122233',
    email: 'amit.rider@ftafat.com',
    passwordHash,
    role: ROLES.DELIVERY_PARTNER,
    isVerified: true,
  });

  const customer = await User.create({
    name: 'Priya Verma',
    phone: '+919822233344',
    email: 'priya@example.com',
    passwordHash,
    role: ROLES.CUSTOMER,
    isVerified: true,
    addresses: [
      {
        label: 'Home',
        line1: 'Flat 402, Green Glen Apartments',
        line2: 'Outer Ring Road',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        isDefault: true,
        location: {
          type: 'Point',
          coordinates: [77.2195, 28.6328], // [lng, lat]
        },
      },
    ],
  });

  // 2. Create Delivery Partner Profile
  console.log('🛵 Seeding Delivery Partner Profile...');
  await DeliveryPartner.create({
    user: riderUser._id,
    vehicle: {
      type: 'bike',
      model: 'Honda Splendor Plus',
      licenseNumber: 'DL-01-AB-1234',
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.2190, 28.6325],
    },
    isOnline: true,
    isAvailable: true,
    documents: {
      isVerified: true,
    },
  });

  // 3. Create Restaurants
  console.log('🍕 Seeding Restaurants...');
  const restaurant1 = await Restaurant.create({
    owner: owner._id,
    name: 'Pizza Paradise',
    description: 'Authentic woodfired Neapolitan pizzas and gourmet Italian appetizers.',
    cuisines: ['Italian', 'Pizza', 'Pasta', 'Fast Food'],
    address: {
      line1: 'Block B, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    location: {
      type: 'Point',
      coordinates: [77.2197, 28.6329], // [lng, lat]
    },
    phone: '+919876543210',
    email: 'contact@pizzaparadise.com',
    isOpen: true,
    isActive: true,
    isVerified: true,
    taxPercent: 5,
    deliveryInfo: {
      estimatedMinutes: 30,
      deliveryFee: 4000, // ₹40.00
      minOrderAmount: 19900, // ₹199.00
      radiusKm: 10,
    },
    rating: {
      average: 4.6,
      count: 128,
    },
  });

  const restaurant2 = await Restaurant.create({
    owner: owner._id,
    name: 'Burger & Biryani Hub',
    description: 'Delicious Hyderabadi dum biryani and juicy smash burgers.',
    cuisines: ['Biryani', 'Burgers', 'Mughlai', 'Indian'],
    address: {
      line1: 'Janpath Lane',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    location: {
      type: 'Point',
      coordinates: [77.2185, 28.6315],
    },
    phone: '+919876543211',
    email: 'info@bbhub.com',
    isOpen: true,
    isActive: true,
    isVerified: true,
    taxPercent: 5,
    deliveryInfo: {
      estimatedMinutes: 25,
      deliveryFee: 3000,
      minOrderAmount: 14900,
      radiusKm: 8,
    },
    rating: {
      average: 4.4,
      count: 89,
    },
  });

  // 4. Create Menu Categories & Items
  console.log('🍔 Seeding Menu Categories & Items...');
  const catPizzas = await MenuCategory.create({
    restaurant: restaurant1._id,
    name: 'Signature Pizzas',
    description: 'Fresh dough made daily with San Marzano tomatoes and fior di latte',
    displayOrder: 1,
  });

  const catSides = await MenuCategory.create({
    restaurant: restaurant1._id,
    name: 'Garlic Breads & Sides',
    displayOrder: 2,
  });

  const catBeverages = await MenuCategory.create({
    restaurant: restaurant1._id,
    name: 'Beverages & Mocktails',
    displayOrder: 3,
  });

  await MenuItem.create([
    {
      restaurant: restaurant1._id,
      category: catPizzas._id,
      name: 'Margherita Classica',
      description: 'Classic sourdough pizza topped with fresh mozzarella, basil, and extra virgin olive oil',
      price: 34900, // ₹349.00
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
    },
    {
      restaurant: restaurant1._id,
      category: catPizzas._id,
      name: 'Fiery Pepperoni Feast',
      description: 'Imported artisanal smoked pepperoni, mozzarella, and chili flakes',
      price: 49900, // ₹499.00
      isVeg: false,
      isAvailable: true,
      isBestseller: true,
    },
    {
      restaurant: restaurant1._id,
      category: catPizzas._id,
      name: 'Farmhouse Veggie Supreme',
      description: 'Bell peppers, red onions, mushrooms, black olives, sweet corn',
      price: 39900, // ₹399.00
      isVeg: true,
      isAvailable: true,
    },
    {
      restaurant: restaurant1._id,
      category: catSides._id,
      name: 'Cheesy Garlic Breadsticks',
      description: 'Warm breadsticks brushed with herb butter and melted mozzarella',
      price: 18900, // ₹189.00
      isVeg: true,
      isAvailable: true,
    },
    {
      restaurant: restaurant1._id,
      category: catBeverages._id,
      name: 'Iced Lemon Mint Cooler',
      description: 'Refreshing cold beverage made with fresh mint and lemon extract',
      price: 12900, // ₹129.00
      isVeg: true,
      isAvailable: true,
    },
  ]);

  // 5. Create Coupons
  console.log('🏷️ Seeding Coupons...');
  await Coupon.create([
    {
      code: 'WELCOME50',
      description: 'Get 50% off on your first order up to ₹100',
      discountType: 'percent',
      value: 50,
      maxDiscount: 10000, // ₹100
      minOrderAmount: 19900, // ₹199
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: 'FLAT100',
      description: 'Flat ₹100 discount on orders above ₹499',
      discountType: 'flat',
      value: 10000, // ₹100.00
      minOrderAmount: 49900, // ₹499.00
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  console.log('\n🎉 Database Seed Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials (Password for all: Password@123):');
  console.log(`• Admin:              ${admin.phone} (${admin.email})`);
  console.log(`• Restaurant Owner:   ${owner.phone} (${owner.email})`);
  console.log(`• Delivery Partner:   ${riderUser.phone} (${riderUser.email})`);
  console.log(`• Customer:           ${customer.phone} (${customer.email})`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
