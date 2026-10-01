'use strict';

const { Router } = require('express');
const controller = require('./catalog.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../common/constants/roles');

const router = Router();

// Public read endpoints
router.get('/categories', (req, res) => controller.getCategories(req, res));
router.get('/search', (req, res) => controller.search(req, res));

// Admin & Merchant write endpoints
router.post(
  '/categories',
  authenticate,
  requirePermission(PERMISSIONS.CATALOG_WRITE),
  (req, res) => controller.createCategory(req, res)
);

router.post(
  '/items/master',
  authenticate,
  requirePermission(PERMISSIONS.CATALOG_WRITE),
  (req, res) => controller.createMasterItem(req, res)
);

router.post(
  '/items/vendor',
  authenticate,
  requirePermission(PERMISSIONS.CATALOG_WRITE),
  (req, res) => controller.createVendorItem(req, res)
);

router.post(
  '/listings',
  authenticate,
  requirePermission(PERMISSIONS.CATALOG_WRITE),
  (req, res) => controller.createListing(req, res)
);

router.patch(
  '/listings/:id',
  authenticate,
  requirePermission(PERMISSIONS.CATALOG_WRITE),
  (req, res) => controller.updateListing(req, res)
);

module.exports = router;
