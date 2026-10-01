'use strict';

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
const logger = require('../../config/logger');
const { randomUUID: uuidv4 } = require('crypto');

async function placeOrder(userId, payload = {}) {
  const {
    deliveryAddress = {},
    idempotencyKey,
    specialInstructions,
    deliveryInstructions,
    items: directItems,
    restaurantId,
    vendorId,
    orderType = 'food',
    vertical = 'food',
    paymentMethod = 'COD',
  } = payload;

  const key = idempotencyKey || uuidv4();
  const existing = await Order.findOne({ idempotencyKey: key });
  if (existing) {
    throw new ConflictError('Order already created with this idempotency key', ERROR_CODES.IDEMPOTENCY_CONFLICT);
  }

  let cart = await cartService.getCart(userId);
  let orderRestaurantId = cart?.restaurant?._id || cart?.restaurant || vendorId || restaurantId;
  let cartItems = cart?.items || [];

  // Support direct items from frontend request body (e.g. food cart or grocery cart)
  if ((!cartItems || !cartItems.length) && directItems && directItems.length) {
    const MenuItem = require('../menu/menuItem.model');
    const itemIds = directItems.map((i) => i.menuItemId || i.productId || i._id).filter(Boolean);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } });
    const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    cartItems = directItems.map((di) => {
      const idStr = (di.menuItemId || di.productId || di._id || '').toString();
      const mItem = menuItemMap.get(idStr);
      const price = di.price || di.pricePaise || mItem?.price || 0;
      const name = di.name || di.title || mItem?.name || 'Item';
      return {
        menuItem: mItem ? mItem._id : (di.menuItemId || di.productId || di._id),
        name,
        price,
        quantity: di.quantity || 1,
        isAvailable: mItem ? mItem.isAvailable : true,
      };
    });

    if (!orderRestaurantId && menuItems.length > 0) {
      orderRestaurantId = menuItems[0].restaurant;
    }
  }

  if (!cartItems.length) {
    throw new BusinessError('Cart is empty. Please add items before placing order.', ERROR_CODES.CART_EMPTY);
  }

  const isGrocery = (vertical === 'grocery' || orderType === 'grocery');
  let restaurant = null;
  if (!isGrocery && orderRestaurantId && mongoose.isValidObjectId(orderRestaurantId)) {
    restaurant = await restaurantService.getRestaurantById(orderRestaurantId).catch(() => null);
  }

  if (isGrocery) {
    const Vendor = require('../vendors/vendor.model');
    let groceryVendor = await Vendor.findOne({ vendorType: { $in: ['grocery_store', 'dark_store'] } });
    if (!groceryVendor) {
      groceryVendor = await Vendor.create({
        name: 'Ftafat Fresh Grocery Mart',
        slug: 'ftafat-fresh-grocery-mart',
        vertical: 'grocery',
        vendorType: 'grocery_store',
        ownership: 'platform',
        address: {
          line1: 'Central Warehouse Plaza',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        },
        images: {
          banner: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg',
        },
      });
    }
    orderRestaurantId = groceryVendor._id;
    restaurant = groceryVendor;
  } else if (!restaurant) {
    const Restaurant = require('../restaurants/restaurant.model');
    restaurant = await Restaurant.findOne({ isActive: true });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Ftafat Food Partner',
        address: {
          street: 'Central Plaza',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        },
        cuisines: ['Indian', 'Fast Food'],
        pricing: { costForTwo: 300, deliveryCharge: 3000 },
      });
    }
    orderRestaurantId = restaurant._id;
  }

  let feeConfig = null;
  try {
    const FeeConfig = require('../admin/feeConfig.model');
    feeConfig = await FeeConfig.findOne({ key: 'GLOBAL_FEES' });
  } catch (e) {}

  const platformFee = feeConfig?.platformFeeEnabled ? (feeConfig.platformFee ?? 500) : 0;
  const taxRate = feeConfig?.taxEnabled ? (feeConfig.taxPercent ?? restaurant?.taxPercent ?? 5) : 0;
  const baseDeliveryFee = feeConfig?.deliveryFeeEnabled ? (feeConfig.baseDeliveryFee ?? restaurant?.deliveryInfo?.deliveryFee ?? 3000) : (restaurant?.deliveryInfo?.deliveryFee || 3000);
  const packagingFee = feeConfig?.packagingFeeEnabled ? (feeConfig.packagingFee ?? 0) : 0;
  const surgeFee = feeConfig?.surgeFeeEnabled ? (feeConfig.surgeFee ?? 0) : 0;

  let customFeesTotal = 0;
  if (feeConfig?.customFees?.length) {
    customFeesTotal = feeConfig.customFees
      .filter((f) => f.isEnabled)
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = baseDeliveryFee;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const discountAmount = cart?.appliedCoupon?.discountAmount || 0;
  const totalAmount = subtotal + deliveryFee + taxAmount + platformFee + packagingFee + surgeFee + customFeesTotal - discountAmount;

  const items = cartItems.map((item) => ({
    menuItem: item.menuItem?._id || item.menuItem,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    totalPrice: item.price * item.quantity,
  }));

  const formattedAddress = {
    line1: deliveryAddress.line1 || deliveryAddress.street || 'Default Street',
    line2: deliveryAddress.line2 || '',
    city: deliveryAddress.city || 'New Delhi',
    state: deliveryAddress.state || 'Delhi',
    pincode: deliveryAddress.pincode || '110001',
    location: deliveryAddress.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
  };

  let razorpayOrder = null;
  if (paymentMethod === 'ONLINE') {
    try {
      razorpayOrder = await razorpayClient.createOrder({
        amount: totalAmount,
        currency: 'INR',
        receipt: `ftafat_${Date.now()}`,
      });
    } catch (err) {
      logger.warn('[Razorpay] Order creation fallback', { error: err.message });
      razorpayOrder = { id: `order_mock_${Date.now()}` };
    }
  }

  const orderData = {
    user: userId,
    customerId: userId,
    restaurant: isGrocery ? null : restaurant._id,
    vendorId: restaurant._id,
    orderNumber: `FTF-${(isGrocery ? 'GRO' : 'FOO')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    vertical: isGrocery ? 'grocery' : (vertical || orderType || 'food'),
    orderType: isGrocery ? 'grocery' : (orderType || 'food'),
    items,
    deliveryAddress: formattedAddress,
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    totalAmount,
    pricing: {
      itemsPaise: subtotal,
      packagingPaise: packagingFee,
      deliveryPaise: deliveryFee,
      taxPaise: taxAmount,
      discountPaise: discountAmount,
      totalPaise: totalAmount,
    },
    couponCode: cart?.appliedCoupon?.code,
    couponId: cart?.appliedCoupon?.couponId,
    idempotencyKey: key,
    specialInstructions: specialInstructions || deliveryInstructions,
    timeline: [{ status: 'pending', timestamp: new Date() }],
  };

  const paymentData = (orderId) => ({
    order: orderId,
    user: userId,
    razorpayOrderId: razorpayOrder?.id || `cod_${orderId}`,
    amount: totalAmount,
    idempotencyKey: key,
    method: paymentMethod,
    status: paymentMethod === 'COD' ? 'pending' : 'created',
  });

  let order;
  let payment;

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        [order] = await Order.create([orderData], { session });
        [payment] = await Payment.create([paymentData(order._id)], { session });
      });
    } finally {
      await session.endSession();
    }
  } catch (err) {
    logger.warn('[Order] Non-transactional order creation fallback', { error: err.message });
    order = await Order.create(orderData);
    payment = await Payment.create(paymentData(order._id));
  }

  await cartService.clearCart(userId).catch(() => {});

  analyticsQueue.add('order-placed', { orderId: order._id, restaurantId: restaurant._id, amount: totalAmount }).catch(() => {});

  return {
    order,
    payment: razorpayOrder ? {
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
    } : null,
  };
}

async function getOrderById(orderId, requestingUser) {
  const order = await Order.findById(orderId)
    .populate('restaurant', 'name phone address coverImage')
    .populate('vendorId', 'name address images')
    .populate('user', 'name phone');

  if (!order) throw new NotFoundError('Order not found');

  const orderUserId = order.user?._id?.toString() || order.user?.toString() || order.customerId?.toString();
  const isOwner = orderUserId === requestingUser.id;
  const isAdmin = ['admin', 'super_admin', 'ops_admin'].includes(requestingUser.role);
  const isRestaurant = ['restaurant_owner', 'merchant_owner'].includes(requestingUser.role);

  if (!isOwner && !isAdmin && !isRestaurant) {
    throw new BusinessError('Access denied', ERROR_CODES.FORBIDDEN);
  }

  return order;
}

async function getUserOrders(userId, query) {
  const { page, limit, skip } = getPagination(query);
  const userFilters = [{ user: userId }, { customerId: userId }];
  if (mongoose.isValidObjectId(userId)) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    userFilters.push({ user: userObjId }, { customerId: userObjId });
  }

  const filter = {
    $or: userFilters,
  };

  if (query.status) filter.orderStatus = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name coverImage')
      .populate('vendorId', 'name images')
      .populate('items.menuItem', 'images isVeg')
      .populate('items.itemId', 'name images isVeg')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
}

async function getRestaurantOrders(restaurantId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    $or: [{ restaurant: restaurantId }, { vendorId: restaurantId }],
  };

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

async function updateOrderStatus(orderId, newStatus, requestingUser, options = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const actor = requestingUser
    ? { id: requestingUser.id || requestingUser._id, role: requestingUser.role || 'system' }
    : { role: 'system' };

  stateMachine.transition(order, newStatus, {
    actor,
    reason: options.reason || 'Status updated',
  });

  if (!order.orderNumber) {
    order.orderNumber = `FTF-${order._id.toString().slice(-6).toUpperCase()}`;
  }
  await order.save();

  await order.populate('user', 'name phone email');
  await order.populate('restaurant', 'name phone address');

  notificationQueue.add('order-status-changed', {
    userId: order.user?._id ? order.user._id.toString() : order.user?.toString?.(),
    orderId: order._id.toString(),
    newStatus: order.orderStatus,
  }).catch(() => {});

  return order;
}

async function cancelOrder(orderId, reason, requestingUser) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const orderUserId = order.user?._id?.toString() || order.user?.toString() || order.customerId?.toString();
  if (orderUserId !== requestingUser.id && !['super_admin', 'ops_admin', 'admin'].includes(requestingUser.role)) {
    throw new BusinessError('Not authorized to cancel this order', ERROR_CODES.FORBIDDEN);
  }

  const currentStatusUpper = (order.orderStatus || order.status || '').toUpperCase();
  if (['CANCELLED', 'REFUNDED', 'REJECTED', 'EXPIRED'].includes(currentStatusUpper)) {
    await order.populate('user', 'name phone email');
    await order.populate('restaurant', 'name phone address');
    await order.populate('items.menuItem', 'images isVeg');
    return order;
  }

  if (currentStatusUpper === 'DELIVERED') {
    throw new BusinessError('Cannot cancel an order that has already been delivered', ERROR_CODES.ORDER_INVALID_TRANSITION);
  }

  stateMachine.transition(order, 'cancelled', {
    actor: { id: requestingUser.id, role: requestingUser.role || 'customer' },
    reason,
  });

  if (reason) {
    order.specialInstructions = order.specialInstructions ? `${order.specialInstructions}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`;
  }

  if (!order.orderNumber) {
    order.orderNumber = `FTF-${order._id.toString().slice(-6).toUpperCase()}`;
  }
  await order.save();

  await order.populate('user', 'name phone email');
  await order.populate('restaurant', 'name phone address');
  await order.populate('items.menuItem', 'images isVeg');

  notificationQueue.add('order-status-changed', {
    userId: requestingUser.id,
    orderId: order._id.toString(),
    newStatus: 'cancelled',
  }).catch(() => {});

  return order;
}

module.exports = {
  placeOrder,
  getOrderById,
  getUserOrders,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
};
