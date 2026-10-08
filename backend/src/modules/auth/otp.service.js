'use strict';

const redis = require('../../config/redis');
const env = require('../../config/env');
const { generateOtp } = require('../../common/utils/generateOtp');
const { BusinessError, UnauthorizedError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');
const { sendOtpViaWakit } = require('../../integrations/wakit.client');

const OTP_PREFIX = 'otp:';
const ATTEMPT_PREFIX = 'otp_attempts:';

async function generateAndStoreOtp(phone) {
  const otp = generateOtp();
  const key = `${OTP_PREFIX}${phone}`;

  await redis.set(key, otp, 'EX', env.otp.ttlSeconds);
  logger.debug('[OTP] Generated and stored locally', { phone, ttl: env.otp.ttlSeconds });

  // Send via Wakit WhatsApp API
  if (env.wakit.apiKey) {
    try {
      await sendOtpViaWakit(phone, otp);
      logger.info('[OTP] WhatsApp OTP sent via Wakit', { phone });
    } catch (err) {
      logger.warn('[OTP] Wakit WhatsApp send error', { phone, err: err.message });
      if (env.node.isProduction) {
        throw new BusinessError('Failed to send OTP via WhatsApp. Please try again.', 'OTP_SEND_FAILED');
      }
    }
  } else {
    logger.warn('[OTP] Wakit API key not configured — WhatsApp message skipped', { phone });
  }

  return otp;
}

async function verifyOtp(phone, otp) {
  const key = `${OTP_PREFIX}${phone}`;
  const attemptsKey = `${ATTEMPT_PREFIX}${phone}`;

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

  if (storedOtp !== String(otp).trim()) {
    await redis.multi()
      .incr(attemptsKey)
      .expire(attemptsKey, env.otp.ttlSeconds)
      .exec();

    throw new UnauthorizedError('Invalid OTP code', ERROR_CODES.INVALID_OTP);
  }

  // Cleanup on success
  await redis.multi().del(key).del(attemptsKey).exec();
  logger.info('[OTP] Verified successfully', { phone });

  return true;
}

async function invalidateOtp(phone) {
  await redis.del(`${OTP_PREFIX}${phone}`);
  await redis.del(`${ATTEMPT_PREFIX}${phone}`);
}

module.exports = { generateAndStoreOtp, verifyOtp, invalidateOtp };
