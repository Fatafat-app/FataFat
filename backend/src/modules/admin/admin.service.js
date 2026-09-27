'use strict';

const User = require('../users/user.model');
const Restaurant = require('../restaurants/restaurant.model');
const Order = require('../orders/order.model');
const DeliveryPartner = require('../delivery/delivery.model');
const AuditLog = require('./auditLog.model');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');
const { NotFoundError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');

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
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY_FOR_PICKUP,
          ORDER_STATUS.OUT_FOR_DELIVERY,
          'pending',
          'confirmed',
          'preparing',
          'ready_for_pickup',
          'out_for_delivery',
        ],
      },
    }),
    DeliveryPartner.countDocuments({ isOnline: true }),
    Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: [ORDER_STATUS.CANCELLED, 'cancelled', 'CANCELLED'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalDeliveryFees: { $sum: { $ifNull: ['$deliveryFee', 0] } },
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
    logistics: { onlineRiders: totalDeliveries },
    finance: {
      totalRevenue: platformStats.totalRevenue,
      totalDeliveryFees: platformStats.totalDeliveryFees,
    },
    financials: {
      grossMerchandiseValue: platformStats.totalRevenue,
      totalDeliveryFees: platformStats.totalDeliveryFees,
    },
  };
}

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

const FeeConfig = require('./feeConfig.model');

async function getFeeConfig() {
  let config = await FeeConfig.findOne({ key: 'GLOBAL_FEES' });
  if (!config) {
    config = await FeeConfig.create({ key: 'GLOBAL_FEES' });
  }
  return config;
}

async function updateFeeConfig(adminId, payload, meta = {}) {
  let config = await FeeConfig.findOne({ key: 'GLOBAL_FEES' });
  if (!config) {
    config = new FeeConfig({ key: 'GLOBAL_FEES' });
  }

  const before = config.toObject ? config.toObject() : config;

  if (payload.platformFee !== undefined) config.platformFee = Math.max(0, Number(payload.platformFee));
  if (payload.platformFeeEnabled !== undefined) config.platformFeeEnabled = Boolean(payload.platformFeeEnabled);

  if (payload.taxPercent !== undefined) config.taxPercent = Math.min(100, Math.max(0, Number(payload.taxPercent)));
  if (payload.taxEnabled !== undefined) config.taxEnabled = Boolean(payload.taxEnabled);

  if (payload.baseDeliveryFee !== undefined) config.baseDeliveryFee = Math.max(0, Number(payload.baseDeliveryFee));
  if (payload.deliveryFeeEnabled !== undefined) config.deliveryFeeEnabled = Boolean(payload.deliveryFeeEnabled);

  if (payload.packagingFee !== undefined) config.packagingFee = Math.max(0, Number(payload.packagingFee));
  if (payload.packagingFeeEnabled !== undefined) config.packagingFeeEnabled = Boolean(payload.packagingFeeEnabled);

  if (payload.surgeFee !== undefined) config.surgeFee = Math.max(0, Number(payload.surgeFee));
  if (payload.surgeFeeEnabled !== undefined) config.surgeFeeEnabled = Boolean(payload.surgeFeeEnabled);

  if (Array.isArray(payload.customFees)) {
    config.customFees = payload.customFees.map((f) => ({
      name: f.name || 'Custom Fee',
      amount: Math.max(0, Number(f.amount || 0)),
      isEnabled: f.isEnabled !== false,
      description: f.description || '',
    }));
  }

  config.updatedBy = adminId;
  await config.save();

  await logAudit({
    adminId,
    action: 'FEE_CONFIG_UPDATE',
    resource: 'FeeConfig',
    resourceId: String(config._id),
    changes: { before, after: config.toObject ? config.toObject() : config },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return config;
}

const Category = require('./category.model');

const DEFAULT_CATEGORIES = [
  { name: 'Pizza', image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg', order: 1, isActive: true },
  { name: 'Burger', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', order: 2, isActive: true },
  { name: 'Paratha', image: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg', order: 3, isActive: true },
  { name: 'Biryani', image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg', order: 4, isActive: true },
  { name: 'Noodles', image: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg', order: 5, isActive: true },
  { name: 'Desserts', image: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg', order: 6, isActive: true },
];

async function getCategories(onlyActive = false) {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
  }

  const filter = onlyActive ? { isActive: true } : {};
  return Category.find(filter).sort({ order: 1, createdAt: 1 }).lean();
}

async function createCategory(adminId, payload, meta = {}) {
  const count = await Category.countDocuments();
  const category = await Category.create({
    name: payload.name,
    image: payload.image,
    order: payload.order !== undefined ? Number(payload.order) : count + 1,
    isActive: payload.isActive !== false,
    description: payload.description || '',
  });

  await logAudit({
    adminId,
    action: 'CATEGORY_CREATE',
    resource: 'Category',
    resourceId: String(category._id),
    changes: { after: category.toObject() },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return category;
}

async function updateCategory(adminId, categoryId, payload, meta = {}) {
  const category = await Category.findById(categoryId);
  if (!category) throw new NotFoundError('Category not found');

  const before = category.toObject();

  if (payload.name !== undefined) category.name = payload.name;
  if (payload.image !== undefined) category.image = payload.image;
  if (payload.order !== undefined) category.order = Number(payload.order);
  if (payload.isActive !== undefined) category.isActive = Boolean(payload.isActive);
  if (payload.description !== undefined) category.description = payload.description;

  await category.save();

  await logAudit({
    adminId,
    action: 'CATEGORY_UPDATE',
    resource: 'Category',
    resourceId: String(categoryId),
    changes: { before, after: category.toObject() },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return category;
}

async function deleteCategory(adminId, categoryId, meta = {}) {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) throw new NotFoundError('Category not found');

  await logAudit({
    adminId,
    action: 'CATEGORY_DELETE',
    resource: 'Category',
    resourceId: String(categoryId),
    changes: { before: category.toObject() },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return category;
}

async function reorderCategories(adminId, items = [], meta = {}) {
  const operations = items.map((item, index) => ({
    updateOne: {
      filter: { _id: item.id || item._id },
      update: { $set: { order: item.order !== undefined ? Number(item.order) : index + 1 } },
    },
  }));

  if (operations.length > 0) {
    await Category.bulkWrite(operations);
  }

  await logAudit({
    adminId,
    action: 'CATEGORIES_REORDER',
    resource: 'Category',
    resourceId: 'BULK',
    changes: { items },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return Category.find().sort({ order: 1, createdAt: 1 }).lean();
}

const Notification = require('../notifications/notification.model');
const { sendPushNotification, sendMulticastNotification } = require('../../integrations/firebase.client');

async function sendNotificationBroadcast(adminId, payload = {}, meta = {}) {
  const {
    title,
    body,
    targetAudience = 'all',
    type = 'announcement',
    imageUrl = '',
    userId = null,
  } = payload;

  if (!title || !title.trim()) {
    throw new BusinessError('Notification title is required', 'VALIDATION_ERROR');
  }
  if (!body || !body.trim()) {
    throw new BusinessError('Notification message is required', 'VALIDATION_ERROR');
  }

  const userFilter = { isActive: { $ne: false } };

  if (userId) {
    userFilter._id = userId;
  } else if (targetAudience === 'customers' || targetAudience === 'users') {
    userFilter.role = { $in: ['customer', 'user'] };
  } else if (targetAudience === 'riders') {
    userFilter.role = 'rider';
  } else if (targetAudience === 'owners') {
    userFilter.role = 'restaurant_owner';
  }

  const targetUsers = await User.find(userFilter).select('_id fcmToken role name phone email').lean();

  if (targetUsers.length === 0) {
    throw new BusinessError('No active recipients found for selected audience', 'NO_RECIPIENTS');
  }

  // Create In-App Notification records in MongoDB
  const notificationDocs = targetUsers.map((u) => ({
    user: u._id,
    title: title.trim(),
    body: body.trim(),
    type: ['order_status', 'payment', 'promotion', 'system', 'delivery', 'announcement', 'alert', 'offer'].includes(type)
      ? type
      : 'announcement',
    data: {
      targetAudience,
      imageUrl: imageUrl || '',
      broadcast: 'true',
      sentAt: new Date().toISOString(),
    },
    isRead: false,
  }));

  try {
    await Notification.insertMany(notificationDocs, { ordered: false });
  } catch (err) {
    logger.warn('[NotificationBroadcast] Bulk insert warning', { error: err.message });
  }

  // Collect FCM tokens for Push Notification
  const validTokens = targetUsers.map((u) => u.fcmToken).filter((token) => typeof token === 'string' && token.length > 10);

  let fcmResult = { successCount: 0, failureCount: 0 };

  if (validTokens.length === 1) {
    try {
      await sendPushNotification(validTokens[0], {
        title: title.trim(),
        body: body.trim(),
        data: { type, imageUrl: imageUrl || '', broadcast: 'true' },
      });
      fcmResult.successCount = 1;
    } catch (err) {
      fcmResult.failureCount = 1;
      logger.warn('[NotificationBroadcast] Single push notification failed', { error: err.message });
    }
  } else if (validTokens.length > 1) {
    try {
      // Chunk tokens in groups of 500 for Firebase Multicast
      for (let i = 0; i < validTokens.length; i += 500) {
        const chunk = validTokens.slice(i, i + 500);
        const res = await sendMulticastNotification(chunk, {
          title: title.trim(),
          body: body.trim(),
          data: { type, imageUrl: imageUrl || '', broadcast: 'true' },
        });
        if (res) {
          fcmResult.successCount += res.successCount || 0;
          fcmResult.failureCount += res.failureCount || 0;
        }
      }
    } catch (err) {
      logger.warn('[NotificationBroadcast] Multicast push notification failed', { error: err.message });
    }
  }

  // Audit log the broadcast
  await logAudit({
    adminId,
    action: 'NOTIFICATION_BROADCAST',
    resource: 'Notification',
    resourceId: 'BROADCAST',
    changes: {
      title,
      body,
      targetAudience,
      type,
      recipientCount: targetUsers.length,
      fcmTokensCount: validTokens.length,
      fcmSuccessCount: fcmResult.successCount,
    },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    title,
    body,
    targetAudience,
    type,
    recipientCount: targetUsers.length,
    fcmTokensCount: validTokens.length,
    fcmSuccessCount: fcmResult.successCount,
    sentAt: new Date().toISOString(),
  };
}

async function getNotificationHistory(query = {}) {
  const { page, limit, skip } = getPagination(query);

  const filter = { 'data.broadcast': 'true' };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('user', 'name phone role email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    meta: buildPaginationMeta(total, page, limit),
  };
}

module.exports = {
  getDashboardOverview,
  logAudit,
  listUsers,
  updateUserStatus,
  updateRestaurantStatus,
  getAuditLogs,
  getFeeConfig,
  updateFeeConfig,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  sendNotificationBroadcast,
  getNotificationHistory,
};
