'use strict';

const { Router } = require('express');
const controller = require('./master.controller');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const { ROLES } = require('../../common/constants/roles');

const router = Router();

// ── PUBLIC OPERATIONAL ROUTES ──
router.get('/cuisines', controller.listCuisines);
router.get('/dietary-types', controller.listDietaryTypes);
router.get('/cancellation-reasons', optionalAuthenticate, controller.listCancellationReasons);
router.get('/food-categories', controller.listFoodCategories);

// ── ADMIN MANAGEMENT ROUTES ──
const adminRouter = Router();
adminRouter.use(authenticate, requireRole([ROLES.ADMIN]));

adminRouter.get('/:type', controller.adminListMasters);
adminRouter.post('/:type', controller.adminCreateMaster);
adminRouter.put('/:type/reorder', controller.adminReorderMasters);
adminRouter.get('/:type/:id', controller.adminGetMaster);
adminRouter.patch('/:type/:id', controller.adminUpdateMaster);
adminRouter.put('/:type/:id', controller.adminUpdateMaster);
adminRouter.delete('/:type/:id', controller.adminDeleteMaster);

module.exports = {
  masterRoutes: router,
  adminMasterRoutes: adminRouter,
};
