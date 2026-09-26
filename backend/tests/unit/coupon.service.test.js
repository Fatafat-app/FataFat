'use strict';

const couponService = require('../../src/modules/coupons/coupon.service');
const Coupon = require('../../src/modules/coupons/coupon.model');
const { BusinessError } = require('../../src/common/errors');

jest.mock('../../src/modules/coupons/coupon.model');

describe('Coupon Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('validates percent discount with cap correctly', async () => {
    Coupon.findOne.mockResolvedValue({
      code: 'SUMMER50',
      isActive: true,
      expiresAt: new Date(Date.now() + 100000),
      usageLimit: 100,
      usageCount: 10,
      perUserLimit: 1,
      usedBy: [],
      minOrderAmount: 20000, // ₹200
      discountType: 'percent',
      value: 50, // 50%
      maxDiscount: 10000, // max ₹100
    });

    const result = await couponService.validateCoupon('SUMMER50', 'user123', 30000); // ₹300 cart
    expect(result.discountAmount).toBe(10000); // Capped at ₹100 (10000 paise)
  });

  test('throws BusinessError when cart total is below min order amount', async () => {
    Coupon.findOne.mockResolvedValue({
      code: 'FLAT50',
      isActive: true,
      expiresAt: new Date(Date.now() + 100000),
      usageLimit: 100,
      usageCount: 5,
      perUserLimit: 1,
      usedBy: [],
      minOrderAmount: 50000, // ₹500
      discountType: 'flat',
      value: 5000,
    });

    await expect(
      couponService.validateCoupon('FLAT50', 'user123', 20000) // ₹200 cart
    ).rejects.toThrow(BusinessError);
  });

  test('throws BusinessError when coupon is expired', async () => {
    Coupon.findOne.mockResolvedValue({
      code: 'EXPIRED',
      isActive: true,
      expiresAt: new Date(Date.now() - 100000), // in the past
      usedBy: [],
    });

    await expect(
      couponService.validateCoupon('EXPIRED', 'user123', 50000)
    ).rejects.toThrow('This coupon has expired');
  });
});
