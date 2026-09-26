'use strict';

const { Router } = require('express');
const controller = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

// All admin routes strictly require ADMIN role
router.use(authenticate, requireRole([ROLES.ADMIN]));

router.get('/dashboard', controller.getDashboard);
router.get('/users', controller.listUsers);
router.patch('/users/:userId', controller.updateUser);
router.patch('/restaurants/:restaurantId/status', controller.updateRestaurant);
router.get('/audit-logs', controller.getAuditLogs);

module.exports = router;
