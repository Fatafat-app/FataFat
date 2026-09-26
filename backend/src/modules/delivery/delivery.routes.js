'use strict';

const { Router } = require('express');
const controller = require('./delivery.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ROLES = require('../../common/constants/roles');
const {
  registerPartnerSchema,
  updateLocationSchema,
  toggleOnlineSchema,
  assignOrderSchema,
} = require('./delivery.validation');

const router = Router();

router.use(authenticate);

// Public / User routes to find nearby or register
router.post('/register', validate(registerPartnerSchema), controller.registerPartner);

// Delivery Partner only routes
router.get('/profile', requireRole([ROLES.DELIVERY_PARTNER]), controller.getProfile);
router.patch('/toggle-online', requireRole([ROLES.DELIVERY_PARTNER]), validate(toggleOnlineSchema), controller.toggleOnline);
router.post('/location', requireRole([ROLES.DELIVERY_PARTNER]), validate(updateLocationSchema), controller.updateLocation);
router.patch('/orders/:orderId/status', requireRole([ROLES.DELIVERY_PARTNER]), controller.updateDeliveryStatus);
router.get('/history', requireRole([ROLES.DELIVERY_PARTNER]), controller.getDeliveryHistory);

// Admin & Restaurant routes
router.get('/nearby', requireRole([ROLES.ADMIN, ROLES.RESTAURANT_OWNER]), controller.findNearbyRiders);
router.post('/assign', requireRole([ROLES.ADMIN, ROLES.RESTAURANT_OWNER]), validate(assignOrderSchema), controller.assignOrder);

module.exports = router;
