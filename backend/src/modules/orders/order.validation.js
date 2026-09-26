'use strict';

/**
 * order.validation.js — Zod schemas for order placement and status updates.
 */

const { z } = require('zod');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');

const placeOrderSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  deliveryAddress: z.object({
    street: z.string().trim().min(2, 'Street is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State is required'),
    postalCode: z.string().trim().min(4, 'Postal code is required'),
    country: z.string().trim().default('India'),
    coordinates: z
      .array(z.number())
      .length(2, 'Coordinates must be [longitude, latitude]')
      .optional(),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'wallet']).default('razorpay'),
  couponCode: z.string().trim().toUpperCase().optional(),
  deliveryInstructions: z.string().trim().max(300).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS)),
  note: z.string().trim().max(200).optional(),
});

module.exports = {
  placeOrderSchema,
  updateOrderStatusSchema,
};
