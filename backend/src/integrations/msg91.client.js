'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';

/**
 * Send OTP via MSG91
 * Uses MSG91 Send OTP API:
 * POST https://control.msg91.com/api/v5/otp
 *
 * @param {string} phone - Phone number with country code (e.g. +919876543210 or 919876543210)
 * @param {string} otp - The OTP to send
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendOtpViaMSG91(phone, otp) {
  // MSG91 expects mobile without + prefix, with country code (e.g. 919876543210)
  const mobile = phone.replace(/^\+/, '');

  try {
    const response = await axios.post(
      `${MSG91_BASE_URL}/otp`,
      {
        mobile,
        otp,
      },
      {
        headers: {
          authkey: env.msg91.authKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    logger.info('[MSG91] OTP send response', { mobile, status: response.status, data });

    if (data?.type === 'success' || response.status === 200 || data?.message === 'OTP sent successfully') {
      return true;
    }

    logger.warn('[MSG91] OTP send returned unexpected response', { mobile, data });
    return true;
  } catch (err) {
    const errMsg = err?.response?.data || err.message;
    logger.error('[MSG91] OTP send error', { mobile, error: errMsg });
    throw err;
  }
}

/**
 * Retry OTP via MSG91
 * POST https://control.msg91.com/api/v5/otp/retry
 *
 * @param {string} phone - Phone with country code
 * @returns {Promise<boolean>}
 */
async function retryOtpViaMSG91(phone) {
  const mobile = phone.replace(/^\+/, '');

  try {
    const response = await axios.post(
      `${MSG91_BASE_URL}/otp/retry`,
      { mobile, retrytype: 'text' },
      {
        headers: {
          authkey: env.msg91.authKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    logger.info('[MSG91] OTP retry response', { mobile, data: response.data });
    return true;
  } catch (err) {
    logger.error('[MSG91] OTP retry error', { mobile, error: err?.response?.data || err.message });
    return false;
  }
}

module.exports = { sendOtpViaMSG91, retryOtpViaMSG91 };
