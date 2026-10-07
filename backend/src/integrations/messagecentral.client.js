'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Parses phone number to country code and mobile number
 * e.g. "+918210235286" -> { countryCode: "91", mobileNumber: "8210235286" }
 */
function parsePhone(phone) {
  const clean = phone.replace(/^\+/, '').trim();
  if (clean.startsWith('91') && clean.length === 12) {
    return { countryCode: '91', mobileNumber: clean.slice(2) };
  }
  if (clean.length === 10) {
    return { countryCode: '91', mobileNumber: clean };
  }
  return { countryCode: '91', mobileNumber: clean };
}

/**
 * Send OTP via Message Central (VerifyNow v3 API)
 * POST https://cpaas.messagecentral.com/verification/v3/send
 *
 * @param {string} phone - Full phone number e.g. +918210235286
 * @param {number} otpLength - OTP digits (4 or 6, default 4)
 * @returns {Promise<{ verificationId: string }>}
 */
async function sendOtpViaMessageCentral(phone, otpLength = 4) {
  const { countryCode, mobileNumber } = parsePhone(phone);
  const { customerId, authToken, baseUrl } = env.messageCentral;

  if (!authToken || !customerId) {
    throw new Error('Message Central credentials not configured in env');
  }

  const url = `${baseUrl}/verification/v3/send?countryCode=${countryCode}&customerId=${customerId}&flowType=SMS&mobileNumber=${mobileNumber}&otpLength=${otpLength}`;

  try {
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          authToken: authToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    logger.info('[MessageCentral] Send OTP response', {
      mobileNumber,
      responseCode: data?.responseCode,
      message: data?.message,
      verificationId: data?.data?.verificationId,
    });

    if (data?.responseCode === 200 || data?.message === 'SUCCESS') {
      return { verificationId: data?.data?.verificationId };
    }

    throw new Error(data?.message || 'Failed to send OTP via Message Central');
  } catch (err) {
    const errMsg = err?.response?.data || err.message;
    logger.error('[MessageCentral] Send OTP failed', { mobileNumber, error: errMsg });
    throw err;
  }
}

/**
 * Validate OTP via Message Central (VerifyNow v3 API)
 * GET https://cpaas.messagecentral.com/verification/v3/validateOtp
 *
 * @param {string} phone - Full phone number
 * @param {string} otp - User entered OTP
 * @param {string} verificationId - ID from send OTP call
 * @returns {Promise<boolean>}
 */
async function verifyOtpViaMessageCentral(phone, otp, verificationId) {
  const { countryCode, mobileNumber } = parsePhone(phone);
  const { customerId, authToken, baseUrl } = env.messageCentral;

  const url = `${baseUrl}/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${customerId}&code=${otp}`;

  try {
    const response = await axios.get(url, {
      headers: {
        authToken: authToken,
      },
      timeout: 10000,
    });

    const data = response.data;
    logger.info('[MessageCentral] Validate OTP response', {
      mobileNumber,
      responseCode: data?.responseCode,
      message: data?.message,
    });

    if (data?.responseCode === 200 || data?.message === 'SUCCESS') {
      return true;
    }

    return false;
  } catch (err) {
    const errMsg = err?.response?.data || err.message;
    logger.error('[MessageCentral] Validate OTP error', { mobileNumber, error: errMsg });
    return false;
  }
}

module.exports = {
  sendOtpViaMessageCentral,
  verifyOtpViaMessageCentral,
};
