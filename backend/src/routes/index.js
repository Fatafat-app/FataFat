'use strict';

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
const groceryRoutes = require('../modules/grocery/grocery.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/grocery', groceryRoutes);

router.use('/restaurants', restaurantRoutes);
router.use('/restaurants/:restaurantId/menu', menuRoutes);

router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

router.use('/delivery', deliveryRoutes);

router.use('/search', searchRoutes);

router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);

router.use('/analytics', analyticsRoutes);
router.use('/support', supportRoutes);

router.use('/admin', adminRoutes);

router.get('/categories', async (_req, res) => {
  const adminService = require('../modules/admin/admin.service');
  const categories = await adminService.getCategories(true);
  res.json({ success: true, data: { categories } });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
