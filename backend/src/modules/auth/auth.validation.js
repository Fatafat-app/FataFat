'use strict';

/**
 * auth.validation.js — Zod schemas for auth routes.
 *
 * All schemas are flat (validate req.body directly).
 * The validate middleware runs these before controllers.
 */

const { z } = require('zod');
const ROLES = require('../../common/constants/roles');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: phoneSchema,
  email: z.string().trim().email('Invalid email').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z
    .enum([ROLES.CUSTOMER, ROLES.RESTAURANT_OWNER, ROLES.DELIVERY_PARTNER])
    .default(ROLES.CUSTOMER),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

const sendOtpSchema = z.object({
  phone: phoneSchema,
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
};
