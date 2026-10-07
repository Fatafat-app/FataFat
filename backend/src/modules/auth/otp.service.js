'use strict';

const redis = require('../../config/redis');
const env = require('../../config/env');
const { generateOtp } = require('../../common/utils/generateOtp');
const { BusinessError, UnauthorizedError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const logger = require('../../config/logger');
const {
  sendOtpViaMessageCentral,
  verifyOtpViaMessageCentral,
} = require('../../integrations/messagecentral.client');

const OTP_PREFIX = 'otp:';
const MC_VID_PREFIX = 'mc_vid:';
const ATTEMPT_PREFIX = 'otp_attempts:';

async function generateAndStoreOtp(phone) {
  const localOtp = generateOtp();
  const key = `${OTP_PREFIX}${phone}`;
  const mcKey = `${MC_VID_PREFIX}${phone}`;

  await redis.set(key, localOtp, 'EX', env.otp.ttlSeconds);
  logger.debug('[OTP] Generated and stored locally', { phone, ttl: env.otp.ttlSeconds });

  // Send via Message Central VerifyNow API
  if (env.messageCentral.authToken && env.messageCentral.customerId) {
    try {
      const { verificationId } = await sendOtpViaMessageCentral(phone, 4);
      if (verificationId) {
        await redis.set(mcKey, verificationId, 'EX', env.otp.ttlSeconds);
        logger.info('[OTP] SMS sent via Message Central VerifyNow', { phone, verificationId });
      }
    } catch (err) {
      logger.warn('[OTP] Message Central send error', { phone, err: err.message });
      if (env.node.isProduction) {
        throw new BusinessError('Failed to send OTP via SMS. Please try again.', 'OTP_SEND_FAILED');
      }
    }
  } else {
    logger.warn('[OTP] Message Central credentials not configured — SMS skipped', { phone });
  }

  return localOtp;
}

async function verifyOtp(phone, otp) {
  const key = `${OTP_PREFIX}${phone}`;
  const mcKey = `${MC_VID_PREFIX}${phone}`;
  const attemptsKey = `${ATTEMPT_PREFIX}${phone}`;

  const attempts = parseInt((await redis.get(attemptsKey)) || '0', 10);
  if (attempts >= env.otp.maxAttempts) {
    throw new BusinessError(
      'Maximum OTP attempts exceeded. Please request a new OTP.',
      ERROR_CODES.OTP_MAX_ATTEMPTS
    );
  }

  let isVerified = false;

  // 1. Try Message Central VerifyNow validation if verificationId is saved
  const verificationId = await redis.get(mcKey);
  if (verificationId && env.messageCentral.authToken) {
    try {
      isVerified = await verifyOtpViaMessageCentral(phone, otp, verificationId);
    } catch (err) {
      logger.warn('[OTP] Message Central verification call failed, trying local fallback', { err: err.message });
    }
  }

  // 2. Fallback to local Redis OTP check (e.g. for development or if local OTP matches)
  if (!isVerified) {
    const storedOtp = await redis.get(key);
    if (storedOtp && storedOtp === otp) {
      isVerified = true;
    }
  }

  if (!isVerified) {
    await redis.multi()
      .incr(attemptsKey)
      .expire(attemptsKey, env.otp.ttlSeconds)
      .exec();

    throw new UnauthorizedError('Invalid or expired OTP', ERROR_CODES.INVALID_OTP);
  }

  // Cleanup on success
  await redis.multi().del(key).del(mcKey).del(attemptsKey).exec();
  logger.info('[OTP] Verified successfully', { phone });

  return true;
}

async function invalidateOtp(phone) {
  await redis.del(`${OTP_PREFIX}${phone}`);
  await redis.del(`${MC_VID_PREFIX}${phone}`);
  await redis.del(`${ATTEMPT_PREFIX}${phone}`);
}

module.exports = { generateAndStoreOtp, verifyOtp, invalidateOtp };
