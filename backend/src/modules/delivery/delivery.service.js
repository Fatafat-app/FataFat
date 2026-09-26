'use strict';

/**
 * delivery.service.js — Delivery Partner business logic.
 *
 * Handles rider registration, online/offline status, real-time location updates,
 * finding nearby available riders, assigning orders, and completing deliveries.
 */

const DeliveryPartner = require('./delivery.model');
const Order = require('../orders/order.model');
const stateMachine = require('../orders/order.stateMachine');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');
const { NotFoundError, BusinessError, ConflictError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const logger = require('../../config/logger');

/**
 * Register or create a delivery partner profile for a user.
 */
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

/**
 * Get delivery partner profile by User ID.
 */
async function getPartnerByUserId(userId) {
  const partner = await DeliveryPartner.findOne({ user: userId }).populate('activeOrder');
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }
  return partner;
}

/**
 * Toggle online / offline status.
 */
async function toggleOnlineStatus(userId, isOnline) {
  const partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }

  partner.isOnline = isOnline;
  if (!isOnline) {
    partner.isAvailable = false;
  } else if (!partner.activeOrder) {
    partner.isAvailable = true;
  }
  await partner.save();

  return partner;
}

/**
 * Update real-time GPS location of the partner and broadcast to order tracking room.
 */
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

  // If rider is currently on an active order or specified orderId, broadcast to socket room
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

/**
 * Find nearby available delivery partners using 2dsphere $near.
 */
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

/**
 * Assign an order to a delivery partner.
 */
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

  // If order is ready for pickup, advance to out for delivery or keep track
  order.deliveryPartner = partner.user;
  await order.save();

  // Emit socket notification
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

/**
 * Partner picks up or delivers the order (updates state machine and earnings).
 */
async function updateDeliveryStatus(userId, orderId, newStatus) {
  const partner = await DeliveryPartner.findOne({ user: userId });
  if (!partner) {
    throw new NotFoundError('Delivery partner profile not found');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (newStatus === ORDER_STATUS.DELIVERED) {
    // Delivery fee earned by rider (default standard ₹40 = 4000 paise if not specified)
    const riderCut = order.deliveryFee || 4000;

    partner.activeOrder = null;
    partner.isAvailable = partner.isOnline;
    partner.earnings.total += riderCut;
    partner.earnings.pendingPayout += riderCut;
    partner.earnings.today += riderCut;
    partner.stats.completedDeliveries += 1;
    await partner.save();

    // Transition order state
    stateMachine.transition(order, ORDER_STATUS.DELIVERED);
    await order.save();
  } else if (newStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
    stateMachine.transition(order, ORDER_STATUS.OUT_FOR_DELIVERY);
    await order.save();
  }

  return { success: true, orderStatus: order.orderStatus };
}

/**
 * Get delivery history for a partner.
 */
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
  updateDeliveryStatus,
  getDeliveryHistory,
};
