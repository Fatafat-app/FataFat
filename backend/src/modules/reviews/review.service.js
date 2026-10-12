'use strict';

const Review = require('./review.model');
const Order = require('../orders/order.model');
const Restaurant = require('../restaurants/restaurant.model');
const { NotFoundError, ForbiddenError, ConflictError, BusinessError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');

async function createReview(userId, { orderId, rating, text, images }) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const orderUserId = (order.user || order.customerId)?.toString();
  if (orderUserId !== userId) {
    throw new ForbiddenError('You can only review your own orders');
  }

  const statusValues = [
    order.orderStatus,
    order.status,
    order.deliveryStatus,
    order.delivery?.status,
  ].filter(Boolean).map((s) => String(s).toUpperCase());

  const isDelivered = statusValues.some((s) => s === 'DELIVERED');
  if (!isDelivered) {
    throw new BusinessError('You can only review an order after it has been delivered', 'ORDER_NOT_DELIVERED');
  }

  const existing = await Review.findOne({ order: orderId });
  if (existing) throw new ConflictError('You have already reviewed this order');

  const targetRestaurant = order.restaurant || order.vendorId;

  const review = await Review.create({
    user: userId,
    restaurant: targetRestaurant,
    order: orderId,
    rating,
    text,
    images: images || [],
  });

  if (targetRestaurant) {
    await updateRestaurantRating(targetRestaurant.toString());
  }

  return review;
}

async function updateRestaurantRating(restaurantId) {
  if (!restaurantId) return;
  const mongoose = require('mongoose');
  let objId;
  try {
    objId = typeof restaurantId === 'string' ? new mongoose.Types.ObjectId(restaurantId) : restaurantId;
  } catch (err) {
    return;
  }

  const stats = await Review.aggregate([
    { $match: { restaurant: objId, isVisible: true } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { average = 0, count = 0 } = stats[0] || {};
  const avgRounded = Math.round(average * 10) / 10;

  // Update Restaurant model if exists
  await Restaurant.findByIdAndUpdate(restaurantId, {
    'rating.average': avgRounded,
    'rating.count': count,
  }).catch(() => null);

  // Also update Vendor model if exists
  try {
    const Vendor = require('../vendors/vendor.model');
    await Vendor.findByIdAndUpdate(restaurantId, {
      ratingAverage: avgRounded || 0,
      ratingCount: count,
    }).catch(() => null);
  } catch (e) {
    // ignore
  }
}

async function getUserReviews(userId, queryParams = {}) {
  const { page, limit, skip } = getPagination(queryParams);

  const filter = { user: userId };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate({
        path: 'restaurant',
        select: 'name images image coverImage address cuisines rating',
      })
      .populate({
        path: 'order',
        select: 'orderNumber items pricing totalAmount createdAt orderStatus status',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, meta: buildPaginationMeta(total, page, limit) };
}

async function getRestaurantReviews(restaurantId, queryParams) {
  const { page, limit, skip } = getPagination(queryParams);

  const filter = { restaurant: restaurantId, isVisible: true };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, meta: buildPaginationMeta(total, page, limit) };
}

module.exports = { createReview, getUserReviews, getRestaurantReviews, updateRestaurantRating };
