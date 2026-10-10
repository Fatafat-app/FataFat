'use strict';

const { z } = require('zod');
const { ORDER_STATUS } = require('../../common/constants/orderStatuses');

const placeOrderSchema = z.object({
  restaurantId: z.string().optional(),
  deliveryAddress: z.object({
    // Accept both 'line1' (frontend) and 'street' (older clients)
    line1: z.string().trim().min(2).optional(),
    street: z.string().trim().min(2).optional(),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2, 'City is required').default('New Delhi'),
    state: z.string().trim().min(2, 'State is required').default('Delhi'),
    // Accept both 'pincode' (frontend) and 'postalCode' (older clients)
    pincode: z.string().trim().min(4).optional(),
    postalCode: z.string().trim().min(4).optional(),
    country: z.string().trim().default('India'),
    coordinates: z.array(z.number()).length(2).optional(),
    location: z.object({
      type: z.string().optional(),
      coordinates: z.array(z.number()).optional(),
    }).optional(),
  }).optional(),
  items: z.array(z.any()).optional(),
  paymentMethod: z.string().transform((v) => v.toLowerCase()).pipe(
    z.enum(['razorpay', 'cod', 'wallet', 'online', 'cash'])
      .transform((v) => v === 'online' ? 'razorpay' : v === 'cash' ? 'cod' : v)
  ).optional().default('cod'),
  couponCode: z.string().trim().toUpperCase().optional(),
  deliveryInstructions: z.string().trim().max(300).optional(),
}).passthrough();

const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS)),
  note: z.string().trim().max(200).optional(),
});

module.exports = {
  placeOrderSchema,
  updateOrderStatusSchema,
};
