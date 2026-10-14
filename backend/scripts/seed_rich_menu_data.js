'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Restaurant = require('../src/modules/restaurants/restaurant.model');
const MenuCategory = require('../src/modules/menu/menuCategory.model');
const MenuItem = require('../src/modules/menu/menuItem.model');

const ITEMS_TO_ADD = [
  // Pizza Paradise (Italian, Pizza, Fast Food)
  {
    restaurantName: 'Pizza Paradise',
    categoryName: 'Starters & Sides',
    items: [
      {
        name: 'Cheesy Garlic Breadsticks',
        description: 'Fresh baked breadsticks brushed with garlic herb butter and melted mozzarella.',
        price: 8900, // ₹89 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.6, count: 68 },
        tags: ['trending', 'budget', 'under99', 'sides'],
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=700&q=80',
      },
      {
        name: 'Choco Lava Cake',
        description: 'Warm chocolate cake with a rich molten Belgian chocolate center.',
        price: 7900, // ₹79 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.8, count: 120 },
        tags: ['dessert', 'budget', 'under99', 'sweet'],
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&q=80',
      },
      {
        name: 'Chilled Cold Coffee',
        description: 'Thick and creamy classic blended iced coffee topped with cocoa powder.',
        price: 6900, // ₹69 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.4, count: 45 },
        tags: ['beverage', 'budget', 'under99'],
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700&q=80',
      },
      {
        name: 'Classic Coke Can (300ml)',
        description: 'Chilled can of Coca Cola.',
        price: 4000, // ₹40 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.9, count: 210 },
        tags: ['drinks', 'budget', 'under99'],
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&q=80',
      },
      {
        name: 'Paneer Makhani Sourdough Pizza',
        description: 'Creamy makhani gravy base topped with marinated paneer, capsicum, and mozzarella.',
        price: 28900, // ₹289
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.7, count: 94 },
        tags: ['trending', 'bestseller', 'pizza'],
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=80',
      },
      {
        name: 'White Sauce Creamy Alfredo Pasta',
        description: 'Penne tossed in silky parmesan cream sauce with sauteed mushrooms and sweet corn.',
        price: 19900, // ₹199
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.5, count: 52 },
        tags: ['pasta', 'italian'],
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=700&q=80',
      },
    ],
  },

  // Burger & Biryani Hub
  {
    restaurantName: 'Burger & Biryani Hub',
    categoryName: 'Starters & Sides',
    items: [
      {
        name: 'Peri Peri Crispy Fries',
        description: 'Golden fried potato fries tossed in zesty African peri peri spice.',
        price: 7900, // ₹79 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.7, count: 140 },
        tags: ['trending', 'budget', 'under99', 'fries'],
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700&q=80',
      },
      {
        name: 'Crispy Veg Momos (6 Pcs)',
        description: 'Pan-fried vegetable dumplings served with fiery red schezwan chutney.',
        price: 8900, // ₹89 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.6, count: 88 },
        tags: ['trending', 'budget', 'under99', 'momos'],
        image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=700&q=80',
      },
      {
        name: 'Crispy Aloo Patty Burger',
        description: 'Spicy potato patty with crunchy lettuce, sliced onions, and creamy mayo in sesame bun.',
        price: 6900, // ₹69 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.3, count: 76 },
        tags: ['budget', 'under99', 'burger'],
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=80',
      },
      {
        name: 'Fresh Mint Lemonade',
        description: 'Refreshing lemon cooler infused with crushed fresh mint leaves and black salt.',
        price: 4900, // ₹49 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.5, count: 32 },
        tags: ['beverage', 'budget', 'under99'],
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&q=80',
      },
      {
        name: 'Butter Chicken Kathi Roll',
        description: 'Succulent tandoori chicken cooked in creamy makhani gravy rolled in flaky paratha.',
        price: 18900, // ₹189
        isVeg: false,
        isBestseller: true,
        rating: { average: 4.8, count: 115 },
        tags: ['trending', 'bestseller', 'rolls'],
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700&q=80',
      },
    ],
  },

  // Tandoori Junction
  {
    restaurantName: 'Tandoori Junction',
    categoryName: 'Tandoori Specials',
    items: [
      {
        name: 'Butter Garlic Naan',
        description: 'Tandoor-baked leavened bread brushed generously with garlic butter and fresh coriander.',
        price: 5500, // ₹55 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.8, count: 185 },
        tags: ['trending', 'budget', 'under99', 'breads'],
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&q=80',
      },
      {
        name: 'Hot Gulab Jamun (2 Pcs)',
        description: 'Soft melt-in-mouth milk dumplings soaked in cardamom infused warm sugar syrup.',
        price: 4900, // ₹49 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.9, count: 240 },
        tags: ['trending', 'budget', 'under99', 'dessert'],
        image: 'https://images.unsplash.com/photo-1668236543090-982473d4d69c?w=700&q=80',
      },
      {
        name: 'Tandoori Butter Roti (2 Pcs)',
        description: 'Crisp whole wheat rotis baked in clay oven topped with amul butter.',
        price: 3500, // ₹35 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.6, count: 90 },
        tags: ['budget', 'under99', 'breads'],
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=700&q=80',
      },
      {
        name: 'Crispy Onion Pakoda Plate',
        description: 'Golden spiced onion fritters served with mint green chutney.',
        price: 7900, // ₹79 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.4, count: 58 },
        tags: ['budget', 'under99', 'snacks'],
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&q=80',
      },
      {
        name: 'Dal Makhani Special Bowl',
        description: 'Black lentils slow cooked overnight with butter, cream, and aromatic Kashmiri spices.',
        price: 18900, // ₹189
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.9, count: 210 },
        tags: ['trending', 'bestseller', 'curry'],
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&q=80',
      },
      {
        name: 'Tandoori Soya Chaap Tikka',
        description: 'Juicy soya chaap marinated in spiced curd and tandoori masala, charred in clay oven.',
        price: 19900, // ₹199
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.7, count: 86 },
        tags: ['trending', 'bestseller', 'tandoori'],
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=700&q=80',
      },
    ],
  },

  // Green Leaf Kitchen (Pure Veg)
  {
    restaurantName: 'Green Leaf Kitchen',
    categoryName: 'Veg Favourites',
    items: [
      {
        name: 'Crispy Podi Idli (2 Pcs)',
        description: 'Steamed rice idlis tossed in pure ghee and spicy South Indian gunpowder podi.',
        price: 6900, // ₹69 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.8, count: 95 },
        tags: ['trending', 'budget', 'under99', 'southindian'],
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80',
      },
      {
        name: 'Traditional Filter Coffee',
        description: 'Authentic decoction brewed South Indian filter kaapi with frothy fresh milk.',
        price: 4900, // ₹49 (Under 99)
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.9, count: 180 },
        tags: ['trending', 'budget', 'under99', 'beverage'],
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=80',
      },
      {
        name: 'Masala Chai with Bun Maska',
        description: 'Fresh ginger cardamom tea served with toasted soft bun slathered with butter.',
        price: 5900, // ₹59 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.7, count: 82 },
        tags: ['budget', 'under99', 'tea'],
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&q=80',
      },
      {
        name: 'Ghee Roast Medu Vada (2 Pcs)',
        description: 'Crispy golden lentil donuts served with hot sambar and fresh coconut dip.',
        price: 7900, // ₹79 (Under 99)
        isVeg: true,
        isBestseller: false,
        rating: { average: 4.5, count: 64 },
        tags: ['budget', 'under99', 'vada'],
        image: 'https://images.unsplash.com/photo-1668236543090-982473d4d69c?w=700&q=80',
      },
      {
        name: 'Special Mysore Masala Dosa',
        description: 'Crispy dosa smeared with fiery red garlic chutney, filled with potato bhaji, roasted in ghee.',
        price: 18900, // ₹189
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.8, count: 142 },
        tags: ['trending', 'bestseller', 'dosa'],
        image: 'https://images.unsplash.com/photo-1668236543090-982473d4d69c?w=700&q=80',
      },
      {
        name: 'South Indian Executive Thali',
        description: 'Complete wholesome meal with 2 vegetable curries, sambar, rasam, curd, 2 pooris, rice and sweet.',
        price: 24900, // ₹249
        isVeg: true,
        isBestseller: true,
        rating: { average: 4.7, count: 110 },
        tags: ['trending', 'bestseller', 'thali'],
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=700&q=80',
      },
    ],
  },
];

async function seedRichMenu() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.db.uri);

  for (const group of ITEMS_TO_ADD) {
    const restaurant = await Restaurant.findOne({ name: group.restaurantName });
    if (!restaurant) {
      console.log(`Restaurant not found: ${group.restaurantName}`);
      continue;
    }

    let category = await MenuCategory.findOne({
      restaurant: restaurant._id,
      name: group.categoryName,
    });

    if (!category) {
      category = await MenuCategory.create({
        restaurant: restaurant._id,
        name: group.categoryName,
        description: `Delicious picks from ${restaurant.name}`,
        displayOrder: 1,
        isActive: true,
      });
    }

    for (const [index, item] of group.items.entries()) {
      await MenuItem.findOneAndUpdate(
        { restaurant: restaurant._id, name: item.name },
        {
          $set: {
            category: category._id,
            description: item.description,
            price: item.price,
            images: [item.image],
            isVeg: item.isVeg,
            isAvailable: true,
            isBestseller: item.isBestseller,
            rating: item.rating,
            tags: item.tags,
            sortOrder: index,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${group.items.length} items for ${restaurant.name}`);
  }

  // Also update existing items so they have proper ratings and bestseller status
  await MenuItem.updateMany(
    { name: 'Hyderabadi Dum Biryani' },
    { $set: { isBestseller: true, rating: { average: 4.8, count: 195 }, tags: ['trending', 'bestseller', 'biryani'] } }
  );
  await MenuItem.updateMany(
    { name: 'Crispy Zinger Burger' },
    { $set: { isBestseller: true, rating: { average: 4.7, count: 155 }, tags: ['trending', 'bestseller', 'burger'] } }
  );
  await MenuItem.updateMany(
    { name: 'Farmhouse Margherita Pizza' },
    { $set: { isBestseller: true, rating: { average: 4.6, count: 98 }, tags: ['trending', 'bestseller', 'pizza'] } }
  );
  await MenuItem.updateMany(
    { name: 'Paneer Tikka Wrap' },
    { $set: { isBestseller: true, rating: { average: 4.7, count: 85 }, tags: ['trending', 'bestseller', 'wrap'] } }
  );
  await MenuItem.updateMany(
    { name: 'Masala Dosa' },
    { $set: { isBestseller: true, rating: { average: 4.9, count: 230 }, tags: ['trending', 'bestseller', 'dosa'] } }
  );
  await MenuItem.updateMany(
    { name: 'Royal Paneer Biryani' },
    { $set: { isBestseller: true, rating: { average: 4.6, count: 72 }, tags: ['trending', 'biryani'] } }
  );

  console.log('Finished rich menu item seeding.');

  // Update restaurants to ensure high-res images and ratings
  await Restaurant.updateOne(
    { name: 'Burger & Biryani Hub' },
    {
      $set: {
        images: [
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85',
          'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&q=85',
        ],
        coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85',
        rating: { average: 4.6, count: 88 },
        taxPercent: 5,
      },
    }
  );

  await Restaurant.updateOne(
    { name: 'Pizza Paradise' },
    {
      $set: {
        images: [
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=85',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=85',
        ],
        coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=85',
        rating: { average: 4.5, count: 64 },
        taxPercent: 5,
      },
    }
  );

  // Ensure real offer banners and spotlight banners in MongoDB
  const Banner = require('../src/modules/banners/banner.model');
  await Banner.updateMany({ section: 'OFFERS_FOR_YOU' }, { $set: { isActive: true } });
  await Banner.updateMany({ section: 'SPOTLIGHT' }, { $set: { isActive: true } });
  await Banner.updateMany({ section: 'FOOD_HERO' }, { $set: { isActive: true } });

  const offerCount = await Banner.countDocuments({ section: 'OFFERS_FOR_YOU', isActive: true });
  if (offerCount < 3) {
    const extraOffers = [
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
    for (const off of extraOffers) {
      await Banner.updateOne(
        { section: 'OFFERS_FOR_YOU', title: off.title },
        { $set: off },
        { upsert: true }
      );
    }
  }

  console.log('Updated restaurants with images and ratings.');
  await mongoose.disconnect();
}

seedRichMenu().catch(console.error);
