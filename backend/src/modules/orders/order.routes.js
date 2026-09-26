'use strict';

const { Router } = require('express');
const controller = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();
router.use(authenticate);

// Customer routes
router.post('/', controller.placeOrder);
router.get('/mine', controller.getMyOrders);
router.get('/:id', controller.getOrder);

// Restaurant owner: get their restaurant's orders
router.get('/restaurant/:restaurantId', requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.getRestaurantOrders);

// Status update: restaurant owner, delivery partner, admin
router.patch('/:id/status', requireRole(ROLES.RESTAURANT_OWNER, ROLES.DELIVERY_PARTNER, ROLES.ADMIN), controller.updateStatus);

module.exports = router;
