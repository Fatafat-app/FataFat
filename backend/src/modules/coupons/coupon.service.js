'use strict';

const Coupon = require('./coupon.model');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

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

  let discountAmount;
  if (coupon.discountType === 'percent') {
    discountAmount = Math.round(cartTotal * coupon.value / 100);
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = Math.min(coupon.value, cartTotal);
  }

  return { coupon, discountAmount };
}

async function redeemCoupon(couponId, userId) {
  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { usageCount: 1 },
    $push: { usedBy: userId },
  });
}

async function createCoupon(data) {
  const normalized = {
    ...data,
    discountType: data.discountType === 'percentage' ? 'percent' : data.discountType,
    value: data.value !== undefined ? data.value : data.discountValue,
    minOrderAmount: data.minOrderAmount !== undefined ? data.minOrderAmount : (data.minOrderValue || 0),
    maxDiscount: data.maxDiscount !== undefined ? data.maxDiscount : data.maxDiscountAmount,
    expiresAt: data.expiresAt || data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
  return Coupon.create(normalized);
}

async function deactivateExpiredCoupons() {
  const result = await Coupon.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { isActive: false }
  );
  return result.modifiedCount;
}

module.exports = { validateCoupon, redeemCoupon, createCoupon, deactivateExpiredCoupons };
