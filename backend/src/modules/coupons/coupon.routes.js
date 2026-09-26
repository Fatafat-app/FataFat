'use strict';

const { Router } = require('express');
const Coupon = require('./coupon.model');
const couponService = require('./coupon.service');
const { success } = require('../../common/response/apiResponse');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

// POST /api/v1/coupons/validate
router.post('/validate', authenticate, async (req, res) => {
  const { code, cartTotal, restaurantId } = req.body;
  const { coupon, discountAmount } = await couponService.validateCoupon(
    code, req.user.id, cartTotal, restaurantId
  );
  success(res, { coupon: { code: coupon.code, discountAmount }, discountAmount }, 'Coupon valid');
});

// Admin: list all coupons
router.get('/', authenticate, requireRole(ROLES.ADMIN), async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  success(res, { items: coupons });
});

// Admin: create coupon
router.post('/', authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  success(res, { coupon }, 'Coupon created', 201);
});

// Admin: toggle coupon active status
router.patch('/:id/toggle', authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  success(res, { coupon }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = router;
