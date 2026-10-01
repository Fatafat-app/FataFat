'use strict';

const CheckoutSession = require('./checkoutSession.model');
const Order = require('../orders/order.model');
const VendorListing = require('../catalog/vendorListing.model');
const { vendorService } = require('../vendors');
const { settingsService } = require('../settings');
const { inventoryService } = require('../inventory');
const { transition } = require('../orders/order.stateMachine');
const razorpayClient = require('../../integrations/razorpay.client');
const { BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../common/constants/orderStatuses');
const logger = require('../../config/logger');

class CheckoutService {
  /**
   * Create a checkout session, reserve stock, and prepare pre-payment orders
   */
  async createSession({
    userId,
    items, // [{ listingId, quantity, variants, addons }]
    address,
    couponCode = null,
    paymentMethod = 'ONLINE',
    idempotencyKey = null,
    actor = null,
  }) {
    if (!items || items.length === 0) {
      throw new BusinessError('Cart is empty', ERROR_CODES.CART_EMPTY);
    }

    // 1. Fetch listings and validate availability
    const listingIds = items.map((i) => i.listingId);
    const listings = await VendorListing.find({ _id: { $in: listingIds } })
      .populate('itemId')
      .populate('vendorId');

    if (listings.length !== items.length) {
      throw new BusinessError('Some items in the cart were not found', ERROR_CODES.NOT_FOUND);
    }

    // 2. Check vertical availability and group by vendor
    const vendorGroups = {};
    let sessionItemsTotalPaise = 0;

    for (const item of items) {
      const listing = listings.find((l) => l._id.toString() === item.listingId);
      if (!listing || !listing.isAvailable) {
        throw new BusinessError(`Item '${listing?.itemId?.name || item.listingId}' is not available`, ERROR_CODES.ITEM_UNAVAILABLE);
      }

      // Verify vertical
      const vCheck = await settingsService.isVerticalAvailable(listing.vertical, {
        vendorId: listing.vendorId._id,
      });
      if (!vCheck.available) {
        throw new BusinessError(vCheck.message?.body || `${listing.vertical} is unavailable`, ERROR_CODES.VERTICAL_UNAVAILABLE);
      }

      const vendorId = listing.vendorId._id.toString();
      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = {
          vendor: listing.vendorId,
          vertical: listing.vertical,
          items: [],
          subtotalPaise: 0,
        };
      }

      const lineTotalPaise = listing.pricePaise * item.quantity;
      sessionItemsTotalPaise += lineTotalPaise;
      vendorGroups[vendorId].subtotalPaise += lineTotalPaise;

      vendorGroups[vendorId].items.push({
        listingId: listing._id,
        itemId: listing.itemId._id,
        name: listing.itemId.name,
        unit: listing.itemId.attributes?.unit || 'piece',
        pricePaise: listing.pricePaise,
        quantity: item.quantity,
        totalPaise: lineTotalPaise,
        taxPaise: Math.round(lineTotalPaise * ((listing.itemId.tax?.gstPercent || 5) / 100)),
        variants: item.variants || [],
        addons: item.addons || [],
      });
    }

    // 3. Atomically reserve inventory stock
    const reservationItems = items.map((i) => ({ listingId: i.listingId, quantity: i.quantity }));
    await inventoryService.reserveStock(reservationItems, null, actor);

    // 4. Calculate total pricing & session expiry
    const deliveryFeePaise = 3000; // Flat ₹30 per checkout in paise
    const packagingFeePaise = 1500;
    const taxPaise = Math.round(sessionItemsTotalPaise * 0.05);
    const discountPaise = couponCode ? 5000 : 0; // e.g. ₹50 coupon discount
    const totalPaise = Math.max(0, sessionItemsTotalPaise + deliveryFeePaise + packagingFeePaise + taxPaise - discountPaise);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    const session = new CheckoutSession({
      userId,
      addressSnapshot: address,
      pricing: {
        itemsPaise: sessionItemsTotalPaise,
        packagingPaise: packagingFeePaise,
        deliveryPaise: deliveryFeePaise,
        taxPaise,
        discountPaise,
        totalPaise,
      },
      couponCode,
      paymentMethod,
      expiresAt,
      idempotencyKey,
      status: 'PAYMENT_PENDING',
    });

    await session.save();

    // 5. Create Order records in PAYMENT_PENDING state
    const createdOrders = [];
    const timestampStr = Date.now().toString().slice(-6);

    for (const [vId, group] of Object.entries(vendorGroups)) {
      const orderNumber = `FTF-${group.vertical.toUpperCase().slice(0, 3)}-${timestampStr}-${Math.floor(100 + Math.random() * 900)}`;

      const order = new Order({
        orderNumber,
        checkoutId: session._id,
        customerId: userId,
        vendorId: group.vendor._id,
        vertical: group.vertical,
        items: group.items,
        deliveryAddress: address,
        pricing: {
          itemsPaise: group.subtotalPaise,
          packagingPaise: packagingFeePaise,
          deliveryPaise: deliveryFeePaise,
          taxPaise: Math.round(group.subtotalPaise * 0.05),
          discountPaise: 0,
          totalPaise: group.subtotalPaise + deliveryFeePaise + packagingFeePaise + Math.round(group.subtotalPaise * 0.05),
        },
        orderStatus: paymentMethod === 'COD' ? ORDER_STATUS.PLACED : ORDER_STATUS.PAYMENT_PENDING,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'COD' ? PAYMENT_STATUS.COD_PENDING : PAYMENT_STATUS.PENDING,
        },
        timeline: [
          {
            status: paymentMethod === 'COD' ? ORDER_STATUS.PLACED : ORDER_STATUS.PAYMENT_PENDING,
            at: new Date(),
            actor: { id: userId, role: 'customer' },
          },
        ],
      });

      await order.save();
      createdOrders.push(order);
    }

    session.orders = createdOrders.map((o) => o._id);

    // 6. Handle payment provider setup
    if (paymentMethod === 'ONLINE') {
      try {
        const razorpayOrder = await razorpayClient.createOrder({
          amountPaise: totalPaise,
          receipt: session._id.toString(),
        });
        session.razorpayOrderId = razorpayOrder.id;
        await session.save();
      } catch (err) {
        logger.error('[Checkout] Razorpay order creation failed', { err: err.message });
      }
    } else if (paymentMethod === 'COD') {
      // Commit stock immediately for COD orders
      await inventoryService.commitReservation(reservationItems, null, actor);
      session.status = 'PAID';
      await session.save();
    }

    return {
      session,
      orders: createdOrders,
      razorpayOrderId: session.razorpayOrderId,
      amountPaise: totalPaise,
    };
  }

  async getSession(sessionId) {
    return CheckoutSession.findById(sessionId).populate('orders');
  }
}

module.exports = new CheckoutService();
