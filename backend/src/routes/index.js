'use strict';

/**
 * routes/index.js — Master router.
 *
 * Mounts all module routes under /api/v1.
 * This is the only file that knows about all modules.
 * Adding a new module = add two lines here.
 */

const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const restaurantRoutes = require('../modules/restaurants/restaurant.routes');
const menuRoutes = require('../modules/menu/menu.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const orderRoutes = require('../modules/orders/order.routes');
const paymentRoutes = require('../modules/payments/payment.routes');
const searchRoutes = require('../modules/search/search.routes');
const couponRoutes = require('../modules/coupons/coupon.routes');
const reviewRoutes = require('../modules/reviews/review.routes');
const deliveryRoutes = require('../modules/delivery/delivery.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const supportRoutes = require('../modules/support/support.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');

const router = Router();

// ── Auth & Users ─────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// ── Restaurants & Menu ───────────────────────────────────────────
router.use('/restaurants', restaurantRoutes);
// Nest menu under restaurants (uses mergeParams)
router.use('/restaurants/:restaurantId/menu', menuRoutes);

// ── Core Commerce ────────────────────────────────────────────────
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

// ── Logistics & Delivery ─────────────────────────────────────────
router.use('/delivery', deliveryRoutes);

// ── Discovery ────────────────────────────────────────────────────
router.use('/search', searchRoutes);

// ── Social & Promotion ───────────────────────────────────────────
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);

// ── Analytics & Support ──────────────────────────────────────────
router.use('/analytics', analyticsRoutes);
router.use('/support', supportRoutes);

// ── Administration ───────────────────────────────────────────────
router.use('/admin', adminRoutes);

// ── Health check ─────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
