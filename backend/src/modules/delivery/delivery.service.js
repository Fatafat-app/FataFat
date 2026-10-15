'use strict';

const DeliveryPartner = require('./delivery.model');
const Order = require('../orders/order.model');
require('../restaurants/restaurant.model');
require('../vendors/vendor.model');
require('../users/user.model');
const stateMachine = require('../orders/order.stateMachine');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');
const { NotFoundError, BusinessError, ConflictError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const logger = require('../../config/logger');

async function registerPartner(userId, data) {
  const existing = await DeliveryPartner.findOne({ user: userId });
  if (existing) {
    throw new ConflictError('Delivery partner profile already exists for this user', ERROR_CODES.CONFLICT);
  }

  const partner = await DeliveryPartner.create({
    user: userId,
    vehicle: data.vehicle,
    documents: data.documents || {},
  });

  return partner;
}

async function getPartnerByUserId(userId) {
  let partner = await DeliveryPartner.findOne({ user: userId }).populate({
    path: 'activeOrder',
    populate: [
      { path: 'restaurant', select: 'name phone address coverImage' },
      { path: 'vendorId', select: 'name phone address images' },
      { path: 'user', select: 'name phone' },
      { path: 'customerId', select: 'name phone' },
      { path: 'deliveryPartner', select: 'name phone vehicle' },
    ],
  });

  if (!partner) {
    partner = await DeliveryPartner.create({
      user: userId,
      vehicle: { type: 'bike', model: 'Motorcycle', licenseNumber: 'DL-RIDER' },
      isOnline: true,
      isAvailable: true,
    });
  } else if (partner.activeOrder) {
    const orderStatus = (partner.activeOrder.orderStatus || partner.activeOrder.status || '').toUpperCase();
    if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(orderStatus)) {
      partner.activeOrder = null;
      partner.isAvailable = partner.isOnline;
      await partner.save();
    }
  }
  return partner;
}

async function toggleOnlineStatus(userId, isOnline) {
  let partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    partner = await DeliveryPartner.create({
      user: userId,
      vehicle: { type: 'bike' },
      isOnline: isOnline,
      isAvailable: isOnline,
    });
  } else {
    partner.isOnline = isOnline;
    if (!isOnline) {
      partner.isAvailable = false;
    } else if (!partner.activeOrder) {
      partner.isAvailable = true;
    }
    await partner.save();
  }

  return partner;
}

async function updateLocation(userId, { latitude, longitude, orderId }) {
  const partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }

  partner.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    updatedAt: new Date(),
  };
  await partner.save();

  const targetOrderId = orderId || (partner.activeOrder ? partner.activeOrder.toString() : null);
  if (targetOrderId) {
    try {
      const { getIO } = require('../../config/socket');
      getIO().to(`order:${targetOrderId}`).emit('delivery:location_update', {
        orderId: targetOrderId,
        partnerId: partner._id,
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.debug('[DeliveryService] Socket broadcast skipped', { error: err.message });
    }
  }

  return { updated: true, coordinates: [longitude, latitude] };
}

async function findNearbyAvailableRiders(longitude, latitude, maxDistanceMeters = 5000) {
  const riders = await DeliveryPartner.find({
    isOnline: true,
    isAvailable: true,
    activeOrder: null,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  })
    .populate('user', 'name phone')
    .limit(10);

  return riders;
}

async function assignOrder(orderId, partnerId) {
  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) {
    throw new NotFoundError('Delivery partner not found');
  }

  if (!partner.isOnline || !partner.isAvailable || partner.activeOrder) {
    throw new BusinessError('Delivery partner is not currently available for new orders', ERROR_CODES.BUSINESS_ERROR);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  partner.activeOrder = order._id;
  partner.isAvailable = false;
  await partner.save();

  order.deliveryPartner = partner.user;
  await order.save();

  try {
    const { getIO } = require('../../config/socket');
    getIO().to(`user:${partner.user}`).emit('delivery:order_assigned', {
      orderId: order._id,
      restaurant: order.restaurant,
      deliveryAddress: order.deliveryAddress,
    });
  } catch (err) {
    logger.debug('[DeliveryService] Socket event skipped', { error: err.message });
  }

  return { assigned: true, orderId: order._id, partnerId: partner._id };
}

async function updateDeliveryStatus(userId, orderId, newStatus) {
  const partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const upperStatus = String(newStatus).toUpperCase();

  if (upperStatus === 'DELIVERED') {
    const riderCut = order.deliveryFee || 4000;

    partner.activeOrder = null;
    partner.isAvailable = partner.isOnline;
    partner.earnings.total += riderCut;
    partner.earnings.pendingPayout += riderCut;
    partner.earnings.today += riderCut;
    partner.stats.completedDeliveries += 1;
    await partner.save();

    order.orderStatus = ORDER_STATUS.DELIVERED;
    order.status = ORDER_STATUS.DELIVERED;
    order.delivery = order.delivery || {};
    order.delivery.status = 'DELIVERED';
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: 'DELIVERED',
      actor: { id: userId, role: 'delivery_partner' },
      timestamp: new Date(),
      reason: 'Delivered to customer',
    });
    await order.save();
  } else if (upperStatus === 'OUT_FOR_DELIVERY' || upperStatus === 'PICKED_UP') {
    order.orderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;
    order.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    order.delivery = order.delivery || {};
    order.delivery.status = 'OUT_FOR_DELIVERY';
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: 'OUT_FOR_DELIVERY',
      actor: { id: userId, role: 'delivery_partner' },
      timestamp: new Date(),
      reason: 'Picked up by delivery partner and out for delivery',
    });
    await order.save();
  } else {
    order.orderStatus = upperStatus;
    order.status = upperStatus;
    await order.save();
  }

  // Real-time Socket & Notification Updates
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    if (io) {
      io.to(`order:${orderId}`).emit('order:status_changed', {
        orderId: String(orderId),
        status: order.orderStatus,
        deliveryStatus: upperStatus,
      });
      const restId = order.restaurant?._id || order.restaurant;
      if (restId) {
        io.to(`restaurant:${restId}`).emit('order:status_changed', {
          orderId: String(orderId),
          status: order.orderStatus,
          deliveryStatus: upperStatus,
        });
      }
      io.emit('admin:order_updated', {
        orderId: String(orderId),
        status: order.orderStatus,
      });
    }
  } catch (err) {
    logger.debug('[DeliveryService] Socket broadcast notice', { error: err.message });
  }

  // Send push notification to customer
  try {
    const User = require('../users/user.model');
    const customer = await User.findById(order.user || order.customerId).lean();
    if (customer?.fcmToken) {
      const { sendPushNotification } = require('../../integrations/firebase.client');
      const isDel = upperStatus === 'DELIVERED';
      sendPushNotification(customer.fcmToken, {
        title: isDel ? 'Order Delivered! 🍽️' : 'Out for Delivery! 🛵',
        body: isDel
          ? 'Your order has been delivered successfully. Enjoy your meal!'
          : 'Your delivery partner has picked up your food and is on the way!',
        data: { orderId: String(orderId), type: 'order_status' },
      }).catch(() => {});
    }
  } catch {}

  return { success: true, orderStatus: order.orderStatus, status: order.status };
}

/**
 * Get active unassigned orders waiting for a rider to accept
 */
async function getAvailableOrders(userId) {
  let partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    partner = await DeliveryPartner.create({
      user: userId,
      isOnline: true,
      isAvailable: true,
    });
  }

  const activeStatuses = [
    'PLACED', 'placed',
    'PENDING', 'pending',
    'PAYMENT_PENDING', 'payment_pending',
    'CONFIRMED', 'confirmed',
    'ACCEPTED', 'accepted',
    'PREPARING', 'preparing',
    'READY', 'ready',
    'READY_FOR_PICKUP', 'ready_for_pickup',
  ];

  const terminalStatuses = [
    'DELIVERED', 'delivered',
    'CANCELLED', 'cancelled',
    'REFUNDED', 'refunded',
    'REJECTED', 'rejected',
    'EXPIRED', 'expired',
  ];

  const orders = await Order.find({
    $or: [{ deliveryPartner: null }, { deliveryPartner: { $exists: false } }],
    $and: [
      {
        $or: [
          { orderStatus: { $in: activeStatuses } },
          { status: { $in: activeStatuses } },
        ],
      },
      { orderStatus: { $nin: terminalStatuses } },
      { status: { $nin: terminalStatuses } },
    ],
  })
    .populate('restaurant', 'name phone address coverImage')
    .populate('vendorId', 'name phone address images')
    .populate('user', 'name phone')
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return orders;
}

/**
 * Atomic Order Claiming:
 * Only ONE rider can claim the order. If another rider clicks at the exact same millisecond,
 * MongoDB atomic CAS query fails and returns 409 Conflict.
 */
async function acceptOrder(userId, orderId) {
  let partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    partner = await DeliveryPartner.create({
      user: userId,
      isOnline: true,
      isAvailable: true,
    });
  }

  if (partner.activeOrder) {
    throw new BusinessError(
      'You already have an active delivery. Please finish your active delivery before accepting another.',
      'RIDER_ALREADY_BUSY'
    );
  }

  // ATOMIC LOCK: Only match if deliveryPartner is NULL and not cancelled/delivered
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      $or: [{ deliveryPartner: null }, { deliveryPartner: { $exists: false } }],
      orderStatus: { $nin: ['CANCELLED', 'DELIVERED', 'REFUNDED', 'cancelled', 'delivered'] },
    },
    {
      $set: {
        deliveryPartner: partner.user,
        'delivery.riderId': partner.user,
        'delivery.status': 'ASSIGNED',
      },
      $push: {
        timeline: {
          status: 'RIDER_ASSIGNED',
          actor: { id: userId, role: 'delivery_partner' },
          timestamp: new Date(),
          reason: 'Order accepted by delivery partner',
        },
      },
    },
    { new: true }
  )
    .populate('restaurant', 'name phone address coverImage')
    .populate('vendorId', 'name phone address images')
    .populate('user', 'name phone fcmToken')
    .populate('customerId', 'name phone')
    .populate('deliveryPartner', 'name phone vehicle avatar');

  if (!order) {
    throw new ConflictError(
      'Ye order kisi aur delivery partner ne accept kar liya hai!',
      ERROR_CODES.CONFLICT
    );
  }

  // Assign order to partner
  partner.activeOrder = order._id;
  partner.isAvailable = false;
  await partner.save();

  // Multi-Channel Real-time Broadcast
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    if (io) {
      const User = require('../users/user.model');
      const partnerUser = await User.findById(partner.user).select('name phone vehicle avatar').lean();
      const riderPayload = {
        id: partnerUser?._id,
        name: partnerUser?.name || 'Assigned Delivery Partner',
        phone: partnerUser?.phone || '',
        vehicle: partner.vehicle || { type: 'bike', model: 'Motorcycle' },
      };

      // 1. Broadcast to all riders to remove this card in real-time
      io.emit('delivery:order_claimed', {
        orderId: String(order._id),
      });

      // 2. Customer gets rider assigned event
      io.to(`order:${order._id}`).emit('order:rider_assigned', {
        orderId: String(order._id),
        rider: riderPayload,
        deliveryPartner: riderPayload,
        status: order.orderStatus,
      });

      // 3. Restaurant owner gets rider assigned event
      const restId = order.restaurant?._id || order.restaurant;
      if (restId) {
        io.to(`restaurant:${restId}`).emit('order:rider_assigned', {
          orderId: String(order._id),
          rider: riderPayload,
          deliveryPartner: riderPayload,
          status: order.orderStatus,
        });
      }

      // 4. Admin Live Orders updates
      io.emit('admin:order_updated', {
        orderId: String(order._id),
        rider: riderPayload,
        deliveryPartner: riderPayload,
        status: order.orderStatus,
      });
    }
  } catch (err) {
    logger.warn('[DeliveryService] Socket broadcast notice', { error: err.message });
  }

  // Send Push Notification to Customer
  try {
    const customer = order.user;
    if (customer?.fcmToken) {
      const { sendPushNotification } = require('../../integrations/firebase.client');
      const User = require('../users/user.model');
      const partnerUser = await User.findById(partner.user).select('name').lean();
      sendPushNotification(customer.fcmToken, {
        title: 'Delivery Partner Assigned! 🚴',
        body: `${partnerUser?.name || 'A delivery partner'} has accepted your order and is on the way!`,
        data: { orderId: String(order._id), type: 'order_status' },
      }).catch(() => {});
    }
  } catch {}

  return order;
}

/**
 * Broadcast new order to all online available riders
 */
async function broadcastOrderToRiders(order) {
  try {
    const availableRiders = await DeliveryPartner.find({
      isOnline: true,
      isAvailable: true,
      activeOrder: null,
    })
      .populate('user', 'name phone fcmToken')
      .lean();

    const { getIO } = require('../../config/socket');
    const io = getIO();
    if (io) {
      io.emit('delivery:order_available', {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        restaurantName: order.restaurant?.name || 'Restaurant',
        restaurantAddress: order.restaurant?.address?.street || order.restaurant?.address?.line1 || 'Restaurant Address',
        deliveryAddress: order.deliveryAddress?.line1 || 'Customer Address',
        deliveryFee: order.deliveryFee || 4000,
        itemsCount: order.items?.length || 1,
        totalAmount: order.totalAmount,
        timestamp: new Date().toISOString(),
      });
    }

    const fcmTokens = availableRiders
      .map((r) => r.user?.fcmToken)
      .filter((t) => typeof t === 'string' && t.length > 10);

    if (fcmTokens.length > 0) {
      const { sendMulticastNotification } = require('../../integrations/firebase.client');
      const restName = order.restaurant?.name || 'Restaurant';
      const feeInRupees = Math.round((order.deliveryFee || 4000) / 100);
      sendMulticastNotification(fcmTokens, {
        title: 'New Delivery Order! 🚨',
        body: `Earn ₹${feeInRupees} • Pickup from ${restName} • Tap to accept!`,
        data: { orderId: String(order._id), type: 'delivery_request' },
      }).catch(() => {});
    }
  } catch (err) {
    logger.warn('[DeliveryService] Broadcast to riders skipped', { error: err.message });
  }
}

async function getDeliveryHistory(userId, query) {
  const partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }

  const { page, limit, skip } = getPagination(query);
  const filter = { deliveryPartner: partner.user, orderStatus: ORDER_STATUS.DELIVERED };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    partnerEarnings: partner.earnings,
    partnerStats: partner.stats,
    meta: buildPaginationMeta(total, page, limit),
  };
}

module.exports = {
  registerPartner,
  getPartnerByUserId,
  toggleOnlineStatus,
  updateLocation,
  findNearbyAvailableRiders,
  assignOrder,
  acceptOrder,
  getAvailableOrders,
  broadcastOrderToRiders,
  updateDeliveryStatus,
  getDeliveryHistory,
};
