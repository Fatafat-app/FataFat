'use strict';

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

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

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

async function sendOtp(phone) {
  const user = await User.findOne({ phone });
  if (!user) {
    throw new NotFoundError('No account found with this phone number');
  }

  const otp = await otpService.generateAndStoreOtp(phone);

  if (!env.node.isProduction) {
    return { otp };
  }

  return {};
}

async function verifyOtpAndLogin({ phone, otp }) {
  await otpService.verifyOtp(phone, otp);

  const user = await User.findOne({ phone });
  if (!user) throw new NotFoundError('User not found');

  if (!user.isActive) {
    throw new BusinessError('Account is deactivated.', ERROR_CODES.ACCOUNT_INACTIVE);
  }

  if (!user.isVerified) {
    user.isVerified = true;
  }

  return issueTokenPair(user);
}

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
    user.refreshTokenHash = null;
    await user.save();
    throw new UnauthorizedError(
      'Refresh token reuse detected. Please log in again.',
      ERROR_CODES.REFRESH_TOKEN_REUSE
    );
  }

  return issueTokenPair(user);
}

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
