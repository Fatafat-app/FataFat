'use strict';

const { Router } = require('express');
const controller = require('./menu.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router({ mergeParams: true }); // Access :restaurantId from parent

// GET /api/v1/restaurants/:restaurantId/menu
router.get('/', optionalAuthenticate, controller.getMenu);

// POST /api/v1/restaurants/:restaurantId/menu/categories
router.post('/categories', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.addCategory);
router.patch('/categories/:categoryId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateCategory);

// Menu items
router.post('/items', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.addItem);
router.patch('/items/:itemId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateItem);
router.patch('/items/:itemId/availability', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.toggleAvailability);

module.exports = router;
