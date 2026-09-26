'use strict';

/**
 * order.service.js — Order management business logic.
 *
 * Placing an order:
 *   1. Validate cart is non-empty and restaurant is open
 *   2. Compute pricing (subtotal, tax, delivery fee, discount)
 *   3. Snapshot items from cart
 *   4. Create order + payment record atomically (Mongoose session)
 *   5. Clear cart
 *   6. Enqueue analytics job
 */

const mongoose = require('mongoose');
const Order = require('./order.model');
const Payment = require('../payments/payment.model');
const cartService = require('../cart/cart.service');
const restaurantService = require('../restaurants/restaurant.service');
const stateMachine = require('./order.stateMachine');
const { notificationQueue, analyticsQueue } = require('../../config/queue');
const { NotFoundError, BusinessError, ConflictError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { getPagination, buildPaginationMeta } = require('../../common/utils/pagination');
const razorpayClient = require('../../integrations/razorpay.client');
const { randomUUID: uuidv4 } = require('crypto');

/**
 * Place an order from the user's cart.
 *
 * @param {string} userId
 * @param {{ deliveryAddress: object, idempotencyKey?: string }} params
 */
async function placeOrder(userId, { deliveryAddress, idempotencyKey, specialInstructions }) {
  // Idempotency check — prevents double submission
  const key = idempotencyKey || uuidv4();
  const existing = await Order.findOne({ idempotencyKey: key });
  if (existing) {
    throw new ConflictError('Order already created with this idempotency key', ERROR_CODES.IDEMPOTENCY_CONFLICT);
  }

  // Get cart
  const cart = await cartService.getCart(userId);
  if (!cart.items || !cart.items.length) {
    throw new BusinessError('Cart is empty', ERROR_CODES.CART_EMPTY);
  }

  // Validate restaurant is open
  const restaurant = await restaurantService.getRestaurantById(cart.restaurant._id || cart.restaurant);
  if (!restaurant.isOpen || !restaurant.isActive) {
    throw new BusinessError('Restaurant is currently closed', ERROR_CODES.RESTAURANT_CLOSED);
  }

  // Validate all items are still available
  for (const item of cart.items) {
    if (item.menuItem && !item.menuItem.isAvailable) {
      throw new BusinessError(`Item '${item.name}' is no longer available`, ERROR_CODES.ITEM_UNAVAILABLE);
    }
  }

  // Compute pricing (all in paise)
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = restaurant.deliveryInfo?.deliveryFee || 0;
  const taxAmount = Math.round(subtotal * (restaurant.taxPercent || 5) / 100);
  const discountAmount = cart.appliedCoupon?.discountAmount || 0;
  const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount;

  // Build item snapshot
  const items = cart.items.map((item) => ({
    menuItem: item.menuItem._id || item.menuItem,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    totalPrice: item.price * item.quantity,
  }));

  // Create Razorpay order first (for payment reference)
  const razorpayOrder = await razorpayClient.createOrder({
    amount: totalAmount,
    currency: 'INR',
    receipt: `ftafat_${Date.now()}`,
  });

  // Use Mongoose session for atomic order + payment creation
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      [order] = await Order.create(
        [
          {
            user: userId,
            restaurant: restaurant._id,
            items,
            deliveryAddress,
            subtotal,
            deliveryFee,
            taxAmount,
            discountAmount,
            totalAmount,
            couponCode: cart.appliedCoupon?.code,
            couponId: cart.appliedCoupon?.couponId,
            idempotencyKey: key,
            specialInstructions,
            timeline: [{ status: 'pending', timestamp: new Date() }],
          },
        ],
        { session }
      );

      await Payment.create(
        [
          {
            order: order._id,
            user: userId,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmount,
            idempotencyKey: key,
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Clear cart after successful order creation
  await cartService.clearCart(userId);

  // Enqueue analytics (non-blocking)
  analyticsQueue.add('order-placed', { orderId: order._id, restaurantId: restaurant._id, amount: totalAmount }).catch(() => {});

  return {
    order,
    payment: {
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
    },
  };
}

/**
 * Get a single order by ID.
 * Ensures the requesting user owns the order (or is admin/restaurant).
 */
async function getOrderById(orderId, requestingUser) {
  const order = await Order.findById(orderId)
    .populate('restaurant', 'name phone address')
    .populate('user', 'name phone');

  if (!order) throw new NotFoundError('Order not found');

  const isOwner = order.user._id.toString() === requestingUser.id;
  const isAdmin = requestingUser.role === 'admin';
  const isRestaurant = requestingUser.role === 'restaurant_owner';

  if (!isOwner && !isAdmin && !isRestaurant) {
    throw new BusinessError('Access denied', ERROR_CODES.FORBIDDEN);
  }

  return order;
}

/**
 * Get all orders for a user (paginated).
 */
async function getUserOrders(userId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { user: userId };

  if (query.status) filter.orderStatus = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * Get all orders for a restaurant (paginated).
 */
async function getRestaurantOrders(restaurantId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { restaurant: restaurantId };

  if (query.status) filter.orderStatus = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * Update order status via the state machine.
 * Emits notification job on transition.
 */
async function updateOrderStatus(orderId, newStatus, requestingUser) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  // Apply state machine transition (throws if invalid)
  stateMachine.transition(order, newStatus);
  await order.save();

  // Enqueue push notification (non-blocking)
  notificationQueue.add('order-status-changed', {
    userId: order.user.toString(),
    orderId: order._id.toString(),
    newStatus,
  }).catch(() => {});

  return order;
}

module.exports = {
  placeOrder,
  getOrderById,
  getUserOrders,
  getRestaurantOrders,
  updateOrderStatus,
};
