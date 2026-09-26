'use strict';

/**
 * admin.service.js — Admin panel business logic.
 *
 * Provides system-wide KPIs, user moderation, restaurant approvals/suspensions,
 * commission configuration, and audit trail logging.
 */

const User = require('../users/user.model');
const Restaurant = require('../restaurants/restaurant.model');
const Order = require('../orders/order.model');
const DeliveryPartner = require('../delivery/delivery.model');
const AuditLog = require('./auditLog.model');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');
const { NotFoundError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');

/**
 * Get platform-wide overview KPI metrics.
 */
async function getDashboardOverview() {
  const [
    totalUsers,
    totalRestaurants,
    activeOrders,
    totalDeliveries,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments({
      orderStatus: {
        $in: [
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY_FOR_PICKUP,
          ORDER_STATUS.OUT_FOR_DELIVERY,
        ],
      },
    }),
    DeliveryPartner.countDocuments({ isOnline: true }),
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalDeliveryFees: { $sum: '$deliveryFee' },
        },
      },
    ]),
  ]);

  const platformStats = revenueAgg[0] || { totalRevenue: 0, totalOrders: 0, totalDeliveryFees: 0 };

  return {
    users: { total: totalUsers },
    restaurants: { total: totalRestaurants },
    orders: { active: activeOrders, total: platformStats.totalOrders },
    riders: { online: totalDeliveries },
    financials: {
      grossMerchandiseValue: platformStats.totalRevenue, // in paise
      totalDeliveryFees: platformStats.totalDeliveryFees,
    },
  };
}

/**
 * Log an administrative audit action.
 */
async function logAudit({ adminId, action, resource, resourceId, changes, ipAddress, userAgent }) {
  return AuditLog.create({
    admin: adminId,
    action,
    resource,
    resourceId,
    changes,
    ipAddress,
    userAgent,
  });
}

/**
 * List all users with pagination and search.
 */
async function listUsers(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * Update user status / role (admin action).
 */
async function updateUserStatus(adminId, targetUserId, { role, isActive }, meta = {}) {
  const user = await User.findById(targetUserId);
  if (!user) throw new NotFoundError('User not found');

  const before = { role: user.role, isActive: user.isActive };
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  await logAudit({
    adminId,
    action: 'USER_UPDATE',
    resource: 'User',
    resourceId: String(targetUserId),
    changes: { before, after: { role: user.role, isActive: user.isActive } },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return user;
}

/**
 * Approve or toggle restaurant active state.
 */
async function updateRestaurantStatus(adminId, restaurantId, { isActive, isVerified }, meta = {}) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurant not found');

  const before = { isActive: restaurant.isActive, isVerified: restaurant.isVerified };
  if (isActive !== undefined) restaurant.isActive = isActive;
  if (isVerified !== undefined) restaurant.isVerified = isVerified;
  await restaurant.save();

  await logAudit({
    adminId,
    action: 'RESTAURANT_STATUS_UPDATE',
    resource: 'Restaurant',
    resourceId: String(restaurantId),
    changes: { before, after: { isActive: restaurant.isActive, isVerified: restaurant.isVerified } },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return restaurant;
}

/**
 * Get audit logs.
 */
async function getAuditLogs(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.action) filter.action = query.action;
  if (query.resource) filter.resource = query.resource;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('admin', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, meta: buildPaginationMeta(total, page, limit) };
}

module.exports = {
  getDashboardOverview,
  logAudit,
  listUsers,
  updateUserStatus,
  updateRestaurantStatus,
  getAuditLogs,
};
