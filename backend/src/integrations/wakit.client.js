'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Ensures phone number is formatted for WhatsApp (e.g. +918210235286)
 * @param {string} phone
 * @returns {string}
 */
function formatPhone(phone) {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('91') && clean.length === 12) return `+${clean}`;
  return `+91${clean}`;
}

/**
 * Send OTP WhatsApp message via Wakit template API
 * POST https://wakit.in/api/v1/messages/template
 *
 * @param {string} phone - User's phone number
 * @param {string} otp - 4-digit OTP code
 * @returns {Promise<{ messageId: string, status: boolean }>}
 */
async function sendOtpViaWakit(phone, otp) {
  const formattedPhone = formatPhone(phone);
  const { apiKey, templateName, templateLang, baseUrl } = env.wakit;

  if (!apiKey) {
    throw new Error('Wakit API key is not configured');
  }

  const payload = {
    to: formattedPhone,
    template: templateName,
    language: templateLang,
    params: [String(otp)],
    button: {
      type: 'url',
      text: String(otp),
    },
  };

  try {
    const response = await axios.post(
      `${baseUrl}/messages/template`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    logger.info('[Wakit] OTP WhatsApp message sent', {
      phone: formattedPhone,
      messageId: data?.data?.id,
      success: data?.success,
    });

    if (data?.success) {
      return { messageId: data?.data?.id, status: true };
    }

    throw new Error(data?.error?.message || 'Wakit send failed');
  } catch (err) {
    const errMsg = err?.response?.data || err.message;
    logger.error('[Wakit] Send WhatsApp OTP error', { phone: formattedPhone, error: errMsg });
    throw err;
  }
}

module.exports = {
  sendOtpViaWakit,
};
