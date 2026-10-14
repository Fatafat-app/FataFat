'use strict';

const mongoose = require('mongoose');

const sectionConfigSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    limit: { type: Number, default: 10, min: 1, max: 50 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const homeConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    sections: {
      heroBanners: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Hero Banners', subtitle: '', limit: 10, sortOrder: 1 }),
      },
      categories: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: "What's on your mind?", subtitle: '', limit: 12, sortOrder: 2 }),
      },
      recommended: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Recommended for You', subtitle: 'Handpicked dishes based on popular cravings', limit: 15, sortOrder: 3 }),
      },
      stealDeals: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Steal Deals for You', subtitle: 'Unbeatable discounts & pocket-friendly feasts', limit: 10, sortOrder: 4 }),
      },
      under99: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: '99 Store', subtitle: 'Meals at ₹99 + Free Delivery', limit: 18, sortOrder: 5 }),
      },
      restaurants: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Restaurants Near You', subtitle: 'Handpicked spots around your location', limit: 10, sortOrder: 6 }),
      },
      trending: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Trending Dishes', subtitle: 'Local favourites everyone is loving', limit: 15, sortOrder: 7 }),
      },
      frequentlyBought: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Frequently bought', subtitle: 'Top picks, ready for your basket', limit: 10, sortOrder: 8 }),
      },
      spotlight: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Spotlight Deals', subtitle: 'Curated dining specials', limit: 10, sortOrder: 9 }),
      },
      mustTry: {
        type: sectionConfigSchema,
        default: () => ({ enabled: true, title: 'Must-Try Products', subtitle: 'Handpicked dishes from top restaurants', limit: 15, sortOrder: 10 }),
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeConfig', homeConfigSchema);
