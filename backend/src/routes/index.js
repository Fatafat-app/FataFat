'use strict';

const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const vendorRoutes = require('../modules/vendors/vendor.routes');
const catalogRoutes = require('../modules/catalog/catalog.routes');
const checkoutRoutes = require('../modules/checkout/checkout.routes');

// Legacy routes for full backward compatibility
const restaurantRoutes = require('../modules/restaurants/restaurant.routes');
const menuRoutes = require('../modules/menu/menu.routes');
const groceryRoutes = require('../modules/grocery/grocery.routes');

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

// V2 Core Architecture Routes
router.use('/config', settingsRoutes);
router.use('/vendors', vendorRoutes);
router.use('/catalog', catalogRoutes);
router.use('/checkout', checkoutRoutes);

// Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Compatibility Routes
router.use('/grocery', groceryRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/restaurants/:restaurantId/menu', menuRoutes);

// Orders, Cart & Payments
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

// Delivery & Search
router.use('/delivery', deliveryRoutes);
router.use('/search', searchRoutes);

// Engagement & Support
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);

router.get('/categories', async (_req, res) => {
  const { catalogService } = require('../modules/catalog');
  const categories = await catalogService.getCategories();
  res.json({ success: true, data: { categories } });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
