'use strict';

const Review = require('./review.model');
const Order = require('../orders/order.model');
const Restaurant = require('../restaurants/restaurant.model');
const { NotFoundError, ForbiddenError, ConflictError, BusinessError } = require('../../common/errors');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');

/**
 * Create a review for a delivered order.
 * Only the order's owner can review, and only after delivery.
 */
async function createReview(userId, { orderId, rating, text, images }) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  if (order.user.toString() !== userId) {
    throw new ForbiddenError('You can only review your own orders');
  }

  if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
    throw new BusinessError('You can only review an order after it has been delivered', 'ORDER_NOT_DELIVERED');
  }

  // Check for duplicate review
  const existing = await Review.findOne({ order: orderId });
  if (existing) throw new ConflictError('You have already reviewed this order');

  const review = await Review.create({
    user: userId,
    restaurant: order.restaurant,
    order: orderId,
    rating,
    text,
    images,
  });

  // Update restaurant's aggregate rating
  await updateRestaurantRating(order.restaurant.toString());

  return review;
}

/**
 * Recompute and update a restaurant's average rating.
 * Called after every review creation/update.
 */
async function updateRestaurantRating(restaurantId) {
  const stats = await Review.aggregate([
    { $match: { restaurant: require('mongoose').Types.ObjectId.createFromHexString(restaurantId), isVisible: true } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { average = 0, count = 0 } = stats[0] || {};

  await Restaurant.findByIdAndUpdate(restaurantId, {
    'rating.average': Math.round(average * 10) / 10, // Round to 1 decimal
    'rating.count': count,
  });
}

/**
 * Get paginated reviews for a restaurant.
 */
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

module.exports = { createReview, getRestaurantReviews, updateRestaurantRating };
