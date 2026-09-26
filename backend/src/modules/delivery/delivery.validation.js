'use strict';

/**
 * delivery.validation.js — Zod schemas for delivery partner routes.
 */

const { z } = require('zod');

const registerPartnerSchema = z.object({
  vehicle: z.object({
    type: z.enum(['bike', 'scooter', 'cycle', 'car', 'electric_scooter']),
    model: z.string().trim().min(1),
    licenseNumber: z.string().trim().min(2),
  }),
  documents: z
    .object({
      drivingLicenseUrl: z.string().url().optional(),
      nationalIdUrl: z.string().url().optional(),
      vehicleInsuranceUrl: z.string().url().optional(),
    })
    .optional(),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  orderId: z.string().optional(),
});

const toggleOnlineSchema = z.object({
  isOnline: z.boolean(),
});

const assignOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  partnerId: z.string().min(1, 'Partner ID is required'),
});

module.exports = {
  registerPartnerSchema,
  updateLocationSchema,
  toggleOnlineSchema,
  assignOrderSchema,
};
