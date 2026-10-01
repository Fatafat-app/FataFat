'use strict';

const { Router } = require('express');
const controller = require('./menu.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router({ mergeParams: true });

router.get('/', optionalAuthenticate, controller.getMenu);

router.post('/categories', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.addCategory);
router.patch('/categories/:categoryId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateCategory);
router.delete('/categories/:categoryId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.deleteCategory);

router.post('/items', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.addItem);
router.patch('/items/:itemId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateItem);
router.patch('/items/:itemId/availability', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.toggleAvailability);
router.delete('/items/:itemId', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.deleteItem);

module.exports = router;
