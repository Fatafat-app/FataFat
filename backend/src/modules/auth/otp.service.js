'use strict';

/**
 * otp.service.js — OTP management via Redis.
 *
 * OTPs are stored ONLY in Redis (never MongoDB) so they auto-expire.
 * Rate limiting is enforced per-phone to prevent brute-force/abuse.
 */

const redis = require('../../config/redis');
const env = require('../../config/env');
const { generateOtp } = require('../../common/utils/generateOtp');
const { BusinessError, UnauthorizedError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');

const OTP_PREFIX = 'otp:';
const ATTEMPT_PREFIX = 'otp_attempts:';

/**
 * Generate and store a new OTP for a phone number.
 * Overwrites any existing OTP (rate limiting is handled separately).
 *
 * @param {string} phone
 * @returns {Promise<string>} The generated OTP (to be sent via SMS)
 */
async function generateAndStoreOtp(phone) {
  const otp = generateOtp();
  const key = `${OTP_PREFIX}${phone}`;

  await redis.set(key, otp, 'EX', env.otp.ttlSeconds);
  logger.debug('[OTP] Generated and stored', { phone, ttl: env.otp.ttlSeconds });

  return otp;
}

/**
 * Verify an OTP for a phone number.
 * - Increments failed attempt counter on wrong OTP
 * - Deletes OTP on successful verification (single-use)
 * - Throws if expired, invalid, or max attempts exceeded
 *
 * @param {string} phone
 * @param {string} otp
 * @returns {Promise<boolean>} true on success
 */
async function verifyOtp(phone, otp) {
  const key = `${OTP_PREFIX}${phone}`;
  const attemptsKey = `${ATTEMPT_PREFIX}${phone}`;

  // Check attempt count before reading OTP (prevent timing oracle)
  const attempts = parseInt((await redis.get(attemptsKey)) || '0', 10);
  if (attempts >= env.otp.maxAttempts) {
    throw new BusinessError(
      'Maximum OTP attempts exceeded. Please request a new OTP.',
      ERROR_CODES.OTP_MAX_ATTEMPTS
    );
  }

  const storedOtp = await redis.get(key);

  if (!storedOtp) {
    throw new UnauthorizedError('OTP has expired. Please request a new one.', ERROR_CODES.OTP_EXPIRED);
  }

  if (storedOtp !== otp) {
    // Increment attempt counter — TTL same as OTP
    await redis.multi()
      .incr(attemptsKey)
      .expire(attemptsKey, env.otp.ttlSeconds)
      .exec();

    throw new UnauthorizedError('Invalid OTP', ERROR_CODES.INVALID_OTP);
  }

  // Correct OTP — delete it (single-use) and clear attempt counter
  await redis.multi().del(key).del(attemptsKey).exec();
  logger.debug('[OTP] Verified successfully', { phone });

  return true;
}

/**
 * Invalidate an OTP (e.g. user requested a new one before expiry).
 *
 * @param {string} phone
 */
async function invalidateOtp(phone) {
  await redis.del(`${OTP_PREFIX}${phone}`);
  await redis.del(`${ATTEMPT_PREFIX}${phone}`);
}

module.exports = { generateAndStoreOtp, verifyOtp, invalidateOtp };
