'use strict';

/**
 * auth.service.js — Authentication business logic.
 *
 * Handles: registration, login, OTP verification, JWT token issuance,
 * refresh token rotation, and logout.
 *
 * Never touches req/res — pure business logic.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const uuidv4 = randomUUID;
const User = require('../users/user.model');
const otpService = require('./otp.service');
const env = require('../../config/env');
const { hashToken } = require('../../common/utils/hashToken');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BusinessError,
} = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const ROLES = require('../../common/constants/roles');

const BCRYPT_COST = 12;

// ─── Token Utilities ───────────────────────────────────────────────

/**
 * Sign a JWT access token (short-lived).
 * @param {{ id: string, role: string }} payload
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

/**
 * Sign a JWT refresh token (long-lived).
 * We embed a jti (JWT ID) so we can detect token reuse.
 * @param {{ id: string }} payload
 */
function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

/**
 * Issue both tokens, store refresh token hash in DB.
 * Returns { accessToken, refreshToken }.
 */
async function issueTokenPair(user) {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  // Store hashed refresh token — raw token never persisted
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      isVerified: user.isVerified,
    },
  };
}

// ─── Auth Operations ──────────────────────────────────────────────

/**
 * Register a new user.
 * Returns the created user (without sensitive fields).
 */
async function register({ name, phone, email, password, role = ROLES.CUSTOMER }) {
  const existing = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });
  if (existing) {
    const field = existing.phone === phone ? 'phone' : 'email';
    throw new ConflictError(`User with this ${field} already exists`, ERROR_CODES.ALREADY_EXISTS);
  }

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : undefined;

  const user = await User.create({
    name,
    phone,
    email,
    passwordHash,
    role,
    isVerified: false,
  });

  return user;
}

/**
 * Login with phone + password.
 * Returns token pair on success.
 */
async function loginWithPassword({ phone, password }) {
  const user = await User.findOne({ phone }).select('+passwordHash');

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new BusinessError('Account is deactivated. Please contact support.', ERROR_CODES.ACCOUNT_INACTIVE);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  return issueTokenPair(user);
}

/**
 * Send OTP to a phone number.
 * Phone number must belong to an existing user.
 */
async function sendOtp(phone) {
  const user = await User.findOne({ phone });
  if (!user) {
    throw new NotFoundError('No account found with this phone number');
  }

  const otp = await otpService.generateAndStoreOtp(phone);

  // Return OTP in dev/test — in prod, SMS service sends it
  if (!env.node.isProduction) {
    return { otp }; // DO NOT return this in prod
  }

  return {};
}

/**
 * Verify OTP and return token pair.
 * Marks user as verified on first successful OTP.
 */
async function verifyOtpAndLogin({ phone, otp }) {
  await otpService.verifyOtp(phone, otp);

  const user = await User.findOne({ phone });
  if (!user) throw new NotFoundError('User not found');

  if (!user.isActive) {
    throw new BusinessError('Account is deactivated.', ERROR_CODES.ACCOUNT_INACTIVE);
  }

  if (!user.isVerified) {
    user.isVerified = true;
    // save handled by issueTokenPair
  }

  return issueTokenPair(user);
}

/**
 * Refresh access token using a valid refresh token.
 * Implements refresh token rotation — old token is invalidated on use.
 * Detects token reuse: if a used token is presented, revokes the whole session.
 */
async function refreshAccessToken(incomingRefreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.jwt.refreshSecret);
  } catch (err) {
    throw new UnauthorizedError(
      err.name === 'TokenExpiredError' ? 'Refresh token has expired' : 'Invalid refresh token',
      err.name === 'TokenExpiredError' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID
    );
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user) throw new UnauthorizedError('User not found', ERROR_CODES.TOKEN_INVALID);

  const incomingHash = hashToken(incomingRefreshToken);

  if (user.refreshTokenHash !== incomingHash) {
    // Token reuse detected — revoke everything
    user.refreshTokenHash = null;
    await user.save();
    throw new UnauthorizedError(
      'Refresh token reuse detected. Please log in again.',
      ERROR_CODES.REFRESH_TOKEN_REUSE
    );
  }

  return issueTokenPair(user);
}

/**
 * Logout: clear the refresh token hash from DB.
 * Makes the refresh token permanently unusable.
 */
async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

module.exports = {
  register,
  loginWithPassword,
  sendOtp,
  verifyOtpAndLogin,
  refreshAccessToken,
  logout,
};
