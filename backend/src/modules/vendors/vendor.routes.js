'use strict';

const { Router } = require('express');
const controller = require('./vendor.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../common/constants/roles');

const router = Router();

router.get('/', (req, res) => controller.list(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));

// Admin vendor management
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  (req, res) => controller.create(req, res)
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  (req, res) => controller.update(req, res)
);

router.post(
  '/:id/pause',
  authenticate,
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  (req, res) => controller.pause(req, res)
);

router.post(
  '/:id/resume',
  authenticate,
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  (req, res) => controller.resume(req, res)
);

module.exports = router;
