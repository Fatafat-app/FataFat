'use strict';

const redis = require('../../config/redis');
const env = require('../../config/env');
const { generateOtp } = require('../../common/utils/generateOtp');
const { BusinessError, UnauthorizedError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');

const OTP_PREFIX = 'otp:';
const ATTEMPT_PREFIX = 'otp_attempts:';

async function generateAndStoreOtp(phone) {
  const otp = generateOtp();
  const key = `${OTP_PREFIX}${phone}`;

  await redis.set(key, otp, 'EX', env.otp.ttlSeconds);
  logger.debug('[OTP] Generated and stored', { phone, ttl: env.otp.ttlSeconds });

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

  if (storedOtp !== otp) {
    await redis.multi()
      .incr(attemptsKey)
      .expire(attemptsKey, env.otp.ttlSeconds)
      .exec();

    throw new UnauthorizedError('Invalid OTP', ERROR_CODES.INVALID_OTP);
  }

  await redis.multi().del(key).del(attemptsKey).exec();
  logger.debug('[OTP] Verified successfully', { phone });

  return true;
}

async function invalidateOtp(phone) {
  await redis.del(`${OTP_PREFIX}${phone}`);
  await redis.del(`${ATTEMPT_PREFIX}${phone}`);
}

module.exports = { generateAndStoreOtp, verifyOtp, invalidateOtp };
