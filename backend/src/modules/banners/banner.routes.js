'use strict';

const { Router } = require('express');
const controller = require('./banner.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../common/constants/roles');

const router = Router();

// Public route to fetch banners for homepage/tabs
router.get('/', controller.getBanners);

// Admin-protected routes
const adminAuth = [authenticate, requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CATALOG_ADMIN])];

router.get('/admin', ...adminAuth, controller.getAllBannersAdmin);
router.post('/', ...adminAuth, controller.createBanner);
router.put('/reorder', ...adminAuth, controller.reorderBanners);
router.patch('/:id/toggle', ...adminAuth, controller.toggleBannerActive);
router.patch('/:id', ...adminAuth, controller.updateBanner);
router.put('/:id', ...adminAuth, controller.updateBanner);
router.delete('/:id', ...adminAuth, controller.deleteBanner);

module.exports = router;
