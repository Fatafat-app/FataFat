'use strict';

/**
 * auth.controller.js — Auth route handlers.
 *
 * Thin layer: extract input → call service → send response.
 * No business logic lives here.
 *
 * Refresh token is sent as HttpOnly cookie + body for flexibility.
 */

const authService = require('./auth.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');
const env = require('../../config/env');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.node.isProduction,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  path: '/api/v1/auth/refresh',      // Scoped to refresh endpoint only
};

async function register(req, res) {
  const user = await authService.register(req.body);
  success(res, { userId: user._id }, 'Account created successfully', StatusCodes.CREATED);
}

async function login(req, res) {
  const { phone, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.loginWithPassword({ phone, password });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  success(res, { accessToken, refreshToken, user }, 'Login successful');
}

async function sendOtp(req, res) {
  const result = await authService.sendOtp(req.body.phone);

  // In development, expose OTP in response for testing
  const data = env.node.isDevelopment ? result : {};
  success(res, data, 'OTP sent successfully');
}

async function verifyOtp(req, res) {
  const { phone, otp } = req.body;
  const { accessToken, refreshToken, user } = await authService.verifyOtpAndLogin({ phone, otp });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  success(res, { accessToken, refreshToken, user }, 'OTP verified. Login successful');
}

async function refresh(req, res) {
  // Accept from cookie (web) or body (mobile)
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(incomingToken);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  success(res, { accessToken, refreshToken }, 'Token refreshed');
}

async function logout(req, res) {
  await authService.logout(req.user.id);

  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  success(res, null, 'Logged out successfully');
}

module.exports = { register, login, sendOtp, verifyOtp, refresh, logout };
