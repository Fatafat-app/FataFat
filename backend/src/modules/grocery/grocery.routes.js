'use strict';

const { Router } = require('express');
const controller = require('./grocery.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');
const {
  getProductsQuerySchema,
  searchProductsQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createBannerSchema,
  updateBannerSchema,
} = require('./grocery.validation');

const router = Router();

// --- Public Endpoints ---
router.get('/home', controller.getHomeFeed);
router.get('/categories', controller.getCategories);
router.get('/products', validate(getProductsQuerySchema), controller.getProducts);
router.get('/products/:idOrSlug', controller.getProduct);
router.get('/search', validate(searchProductsQuerySchema), controller.searchProducts);
router.get('/banners', controller.getBanners);

// --- Admin / Staff Protected Endpoints ---
const adminAuth = [authenticate, requireRole(ROLES.ADMIN)];

// Categories Admin
router.post('/categories', ...adminAuth, validate(createCategorySchema), controller.createCategory);
router.patch('/categories/:id', ...adminAuth, validate(updateCategorySchema), controller.updateCategory);
router.delete('/categories/:id', ...adminAuth, controller.deleteCategory);

// Products Admin
router.post('/products', ...adminAuth, validate(createProductSchema), controller.createProduct);
router.patch('/products/:id', ...adminAuth, validate(updateProductSchema), controller.updateProduct);
router.patch('/products/:id/availability', ...adminAuth, controller.toggleProductAvailability);
router.delete('/products/:id', ...adminAuth, controller.deleteProduct);

// Banners Admin
router.post('/banners', ...adminAuth, validate(createBannerSchema), controller.createBanner);
router.patch('/banners/:id', ...adminAuth, validate(updateBannerSchema), controller.updateBanner);
router.delete('/banners/:id', ...adminAuth, controller.deleteBanner);

module.exports = router;
