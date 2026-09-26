'use strict';

const crypto = require('crypto');

/**
 * generateOtp.js — Cryptographically secure OTP generator.
 *
 * Uses crypto.randomInt (CSPRNG) — NOT Math.random().
 * Always 6 digits, zero-padded.
 */

/**
 * Generate a 6-digit OTP.
 * @returns {string} e.g. '047392'
 */
function generateOtp() {
  // randomInt(0, 999999) gives 0-999999, then we pad to 6 digits
  const otp = crypto.randomInt(0, 1_000_000);
  return otp.toString().padStart(6, '0');
}

module.exports = { generateOtp };
