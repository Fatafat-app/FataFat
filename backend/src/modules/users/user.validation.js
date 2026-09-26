'use strict';

/**
 * user.validation.js — Zod schemas for user profile & address routes.
 */

const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  avatar: z.string().url().optional(),
  fcmToken: z.string().optional(),
});

const addressSchema = z.object({
  street: z.string().trim().min(2, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  postalCode: z.string().trim().min(4, 'Postal code is required'),
  country: z.string().trim().default('India'),
  isDefault: z.boolean().optional().default(false),
  coordinates: z
    .array(z.number())
    .length(2, 'Coordinates must be [longitude, latitude]')
    .optional(),
});

module.exports = {
  updateProfileSchema,
  addressSchema,
};
