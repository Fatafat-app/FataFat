'use strict';

const { Router } = require('express');
const controller = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

router.use(authenticate, requireRole([ROLES.ADMIN]));

router.get('/dashboard', controller.getDashboard);
router.get('/users', controller.listUsers);
router.patch('/users/:userId', controller.updateUser);
router.get('/restaurants', controller.listRestaurants);
router.patch('/restaurants/:restaurantId', controller.updateRestaurant);
router.patch('/restaurants/:restaurantId/status', controller.updateRestaurant);

router.get('/audit-logs', controller.getAuditLogs);
router.get('/fees', controller.getFees);
router.put('/fees', controller.updateFees);
router.patch('/fees', controller.updateFees);

router.get('/categories', controller.listCategories);
router.post('/categories', controller.createCategory);
router.put('/categories/reorder', controller.reorderCategories);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/orders', controller.listOrders);
router.patch('/orders/:id/status', controller.updateOrderStatus);

router.post('/notifications', controller.sendNotification);
router.get('/notifications', controller.getNotificationHistory);

module.exports = router;

