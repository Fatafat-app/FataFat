'use strict';

const { Router } = require('express');
const controller = require('./order.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();
router.use(authenticate);

router.post('/', controller.placeOrder);
router.get('/fees/current', controller.getCurrentFees);
router.get('/mine', controller.getMyOrders);
router.get('/:id', controller.getOrder);
router.patch('/:id/cancel', controller.cancelOrder);

router.get('/restaurant/:restaurantId', requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.getRestaurantOrders);

router.patch('/:id/status', requireRole(ROLES.RESTAURANT_OWNER, ROLES.DELIVERY_PARTNER, ROLES.ADMIN), controller.updateStatus);

module.exports = router;
