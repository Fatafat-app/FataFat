'use strict';

const { Router } = require('express');
const controller = require('./restaurant.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

// Public routes
router.get('/nearby', optionalAuthenticate, controller.getNearby);
router.get('/:id', controller.getRestaurant);

// Owner routes
router.post('/', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.createRestaurant);
router.patch('/:id', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateRestaurant);
router.patch('/:id/toggle-open', authenticate, requireRole(ROLES.RESTAURANT_OWNER), controller.toggleOpen);
router.get('/owner/mine', authenticate, requireRole(ROLES.RESTAURANT_OWNER), controller.getMyRestaurants);

module.exports = router;
