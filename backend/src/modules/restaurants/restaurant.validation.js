'use strict';

/**
 * restaurant.validation.js — Zod schemas for restaurant management.
 */

const { z } = require('zod');

const createRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Restaurant name is required').max(120),
  description: z.string().trim().max(1000).optional(),
  cuisine: z.array(z.string().trim()).min(1, 'At least one cuisine is required'),
  address: z.object({
    street: z.string().trim().min(2),
    city: z.string().trim().min(2),
    state: z.string().trim().min(2),
    postalCode: z.string().trim().min(4),
    country: z.string().trim().default('India'),
  }),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
  }),
  phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  email: z.string().trim().email().optional(),
  image: z.string().url().optional(),
  openingHours: z
    .object({
      open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
      close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
    })
    .optional(),
  deliveryRadiusKm: z.number().positive().default(10),
  minOrderAmount: z.number().nonnegative().default(0), // in paise
});

const updateRestaurantSchema = createRestaurantSchema.partial();

const toggleStatusSchema = z.object({
  isOpen: z.boolean(),
});

module.exports = {
  createRestaurantSchema,
  updateRestaurantSchema,
  toggleStatusSchema,
};
