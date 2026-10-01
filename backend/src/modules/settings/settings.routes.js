'use strict';

const { Router } = require('express');
const controller = require('./settings.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../common/constants/roles');

const router = Router();

// Public bootstrap endpoint
router.get('/bootstrap', (req, res) => controller.getBootstrap(req, res));

// Admin vertical management
router.get(
  '/verticals',
  authenticate,
  requirePermission(PERMISSIONS.VERTICAL_TOGGLE),
  (req, res) => controller.getVerticals(req, res)
);

router.put(
  '/verticals/:vertical',
  authenticate,
  requirePermission(PERMISSIONS.VERTICAL_TOGGLE),
  (req, res) => controller.setVertical(req, res)
);

module.exports = router;
