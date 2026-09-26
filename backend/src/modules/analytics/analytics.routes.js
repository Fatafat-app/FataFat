'use strict';

const { Router } = require('express');
const controller = require('./analytics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

router.use(authenticate);

// Restaurant analytics: owner or admin
router.get('/restaurants/:restaurantId', requireRole([ROLES.RESTAURANT_OWNER, ROLES.ADMIN]), controller.getRestaurantAnalytics);

// Platform analytics: admin only
router.get('/platform', requireRole([ROLES.ADMIN]), controller.getPlatformAnalytics);

module.exports = router;
