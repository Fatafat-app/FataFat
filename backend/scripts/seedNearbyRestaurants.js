'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const env = require('../src/config/env');
const User = require('../src/modules/users/user.model');
const Restaurant = require('../src/modules/restaurants/restaurant.model');
const MenuCategory = require('../src/modules/menu/menuCategory.model');
const MenuItem = require('../src/modules/menu/menuItem.model');
const { ROLES } = require('../src/common/constants/roles');

const RESTAURANTS = [
  {
    name: 'Tandoori Junction',
    description: 'Freshly grilled tandoori favourites, wraps, and North Indian meals.',
    cuisines: ['North Indian', 'Tandoori', 'Mughlai'],
    address: {
      line1: '12 Janpath Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    coordinates: [77.2178, 28.6312],
    phone: '+919876543213',
    email: 'hello@tandoorijunction.example',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&q=85',
    estimatedMinutes: 28,
    deliveryFee: 2500,
    minOrderAmount: 14900,
    category: 'Tandoori Specials',
    items: [
      {
        name: 'Paneer Tikka Wrap',
        description: 'Smoky paneer tikka, mint chutney, and crisp salad in a soft wrap.',
        price: 21900,
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&q=80',
      },
      {
        name: 'Chicken Tikka Meal',
        description: 'Chargrilled chicken tikka served with fragrant rice and mint dip.',
        price: 32900,
        isVeg: false,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=700&q=80',
      },
    ],
  },
  {
    name: 'Green Leaf Kitchen',
    description: 'A neighbourhood kitchen for wholesome vegetarian meals and South Indian classics.',
    cuisines: ['South Indian', 'Pure Veg', 'Healthy'],
    address: {
      line1: '8 Connaught Circus',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    coordinates: [77.2204, 28.6341],
    phone: '+919876543214',
    email: 'hello@greenleafkitchen.example',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85',
    estimatedMinutes: 24,
    deliveryFee: 2000,
    minOrderAmount: 9900,
    isPureVeg: true,
    category: 'Veg Favourites',
    items: [
      {
        name: 'Masala Dosa',
        description: 'Crisp dosa filled with spiced potato, served with sambar and chutneys.',
        price: 16900,
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1668236543090-982473d4d69c?w=700&q=80',
      },
      {
        name: 'Paneer Rice Bowl',
        description: 'Tandoori paneer, seasoned rice, and fresh vegetables with mint dressing.',
        price: 23900,
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&q=80',
      },
    ],
  },
];

async function ensureRestaurant(ownerId, data) {
  let restaurant = await Restaurant.findOne({ name: data.name });

  if (!restaurant) {
    restaurant = await Restaurant.create({
      owner: ownerId,
      name: data.name,
      description: data.description,
      cuisines: data.cuisines,
      address: data.address,
      location: { type: 'Point', coordinates: data.coordinates },
      phone: data.phone,
      email: data.email,
      images: [data.image],
      coverImage: data.image,
      isPureVeg: data.isPureVeg || false,
      isOpen: true,
      isActive: true,
      isApproved: true,
      isVerified: true,
      timings: { open: '09:00', close: '23:00' },
      deliveryInfo: {
        estimatedMinutes: data.estimatedMinutes,
        deliveryFee: data.deliveryFee,
        minOrderAmount: data.minOrderAmount,
        radiusKm: 10,
      },
      rating: { average: 4.5, count: 24 },
    });
  } else {
    restaurant.isActive = true;
    restaurant.isApproved = true;
    restaurant.isOpen = true;
    await restaurant.save();
  }

  let category = await MenuCategory.findOne({
    restaurant: restaurant._id,
    name: data.category,
  });

  if (!category) {
    category = await MenuCategory.create({
      restaurant: restaurant._id,
      name: data.category,
      description: `Popular picks from ${data.name}.`,
      displayOrder: 1,
      isActive: true,
    });
  }

  for (const [sortOrder, item] of data.items.entries()) {
    await MenuItem.updateOne(
      { restaurant: restaurant._id, name: item.name },
      {
        $setOnInsert: {
          restaurant: restaurant._id,
          category: category._id,
          name: item.name,
          description: item.description,
          price: item.price,
          images: [item.image],
          isVeg: item.isVeg,
          isAvailable: true,
          isBestseller: sortOrder === 0,
          sortOrder,
        },
      },
      { upsert: true }
    );
  }

  return restaurant;
}

async function seedNearbyRestaurants() {
  await mongoose.connect(env.db.uri);

  try {
    const existingRestaurant = await Restaurant.findOne({ isActive: true }).select('owner');
    const owner = existingRestaurant?.owner
      ? await User.findById(existingRestaurant.owner)
      : await User.findOne({ role: ROLES.RESTAURANT_OWNER, isActive: true });

    if (!owner) {
      throw new Error('Create a restaurant owner account before seeding nearby restaurants.');
    }

    const restaurants = [];
    for (const data of RESTAURANTS) {
      restaurants.push(await ensureRestaurant(owner._id, data));
    }

    console.log(`Nearby restaurants ready: ${restaurants.map((restaurant) => restaurant.name).join(', ')}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedNearbyRestaurants().catch((error) => {
  console.error('Failed to seed nearby restaurants:', error);
  process.exitCode = 1;
});
