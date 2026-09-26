'use strict';

const Coupon = require('./coupon.model');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

/**
 * Validate a coupon code and return discount amount.
 *
 * @param {string} code
 * @param {string} userId
 * @param {number} cartTotal - Paise
 * @param {string} [restaurantId]
 * @returns {{ coupon, discountAmount: number }}
 */
async function validateCoupon(code, userId, cartTotal, restaurantId) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) throw new BusinessError('Invalid coupon code', ERROR_CODES.COUPON_INVALID);

  if (new Date() > coupon.expiresAt) {
    throw new BusinessError('This coupon has expired', ERROR_CODES.COUPON_EXPIRED);
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new BusinessError('Coupon usage limit reached', ERROR_CODES.COUPON_LIMIT_REACHED);
  }

  const userUsageCount = coupon.usedBy.filter((uid) => uid.toString() === userId).length;
  if (userUsageCount >= (coupon.perUserLimit || 1)) {
    throw new BusinessError('You have already used this coupon', ERROR_CODES.COUPON_LIMIT_REACHED);
  }

  if (cartTotal < coupon.minOrderAmount) {
    throw new BusinessError(
      `Minimum order amount of ₹${coupon.minOrderAmount / 100} required for this coupon`,
      ERROR_CODES.COUPON_MIN_ORDER
    );
  }

  if (coupon.restaurantId && coupon.restaurantId.toString() !== restaurantId) {
    throw new BusinessError('Coupon not valid for this restaurant', ERROR_CODES.COUPON_INVALID);
  }

  // Calculate discount
  let discountAmount;
  if (coupon.discountType === 'percent') {
    discountAmount = Math.round(cartTotal * coupon.value / 100);
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = Math.min(coupon.value, cartTotal); // Can't discount more than cart
  }

  return { coupon, discountAmount };
}

/**
 * Redeem a coupon (increment usage count).
 * Called at order placement, not at validation time.
 */
async function redeemCoupon(couponId, userId) {
  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { usageCount: 1 },
    $push: { usedBy: userId },
  });
}

/**
 * Admin: create a coupon.
 */
async function createCoupon(data) {
  return Coupon.create(data);
}

/**
 * Admin: deactivate expired coupons (called by cron job).
 */
async function deactivateExpiredCoupons() {
  const result = await Coupon.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { isActive: false }
  );
  return result.modifiedCount;
}

module.exports = { validateCoupon, redeemCoupon, createCoupon, deactivateExpiredCoupons };
