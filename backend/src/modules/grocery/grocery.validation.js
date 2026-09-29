'use strict';

const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const getProductsQuerySchema = z.object({
  query: z.object({
    category: z.string().trim().optional(),
    filter: z.enum(['price', 'popularity', 'deals', 'organic']).optional(),
    badge: z.enum(['deal', 'best_seller', 'organic']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['price_asc', 'price_desc', 'popularity', 'rating', 'newest']).optional(),
    isOrganic: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    isSpecialDeal: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    isTrending: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).optional(),
  }),
});

const searchProductsQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, 'Search query is required').max(100),
    limit: z.coerce.number().int().min(1).max(30).default(10),
  }),
});

const categoryBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().trim().toLowerCase().optional(),
  emoji: z.string().trim().optional(),
  image: z.string().trim().url().optional().or(z.literal('')),
  bg: z.string().trim().default('#FFFFFF'),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const createCategorySchema = z.object({
  body: categoryBodySchema,
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid category ID'),
  }),
  body: categoryBodySchema.partial(),
});

const productBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().trim().toLowerCase().optional(),
  category: z.string().trim().refine((val) => objectIdRegex.test(val) || val.length > 0, {
    message: 'Invalid category identifier',
  }),
  description: z.string().trim().max(1000).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  originalPrice: z.number().min(0).optional(),
  unit: z.string().trim().min(1, 'Unit is required').max(50),
  images: z.array(z.string().trim()).default([]),
  badge: z.enum(['deal', 'best_seller', 'organic']).nullable().optional(),
  discount: z.string().trim().max(50).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().min(0).default(0),
  stockQuantity: z.number().int().min(0).default(100),
  isAvailable: z.boolean().default(true),
  isOrganic: z.boolean().default(false),
  isSpecialDeal: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string().trim()).default([]),
  nutrition: z
    .object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

const createProductSchema = z.object({
  body: productBodySchema,
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
  body: productBodySchema.partial(),
});

const bannerBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200).optional(),
  code: z.string().trim().toUpperCase().optional(),
  image: z.string().trim().min(1, 'Image is required'),
  bgGradient: z
    .object({
      from: z.string().default('#2E7D32'),
      to: z.string().default('#1B5E20'),
    })
    .optional(),
  linkType: z.enum(['category', 'product', 'deal', 'external', 'none']).default('none'),
  targetId: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const createBannerSchema = z.object({
  body: bannerBodySchema,
});

const updateBannerSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid banner ID'),
  }),
  body: bannerBodySchema.partial(),
});

module.exports = {
  getProductsQuerySchema,
  searchProductsQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createBannerSchema,
  updateBannerSchema,
};
