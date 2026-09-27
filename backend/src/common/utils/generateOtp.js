'use strict';

const crypto = require('crypto');

function generateOtp() {
  const otp = crypto.randomInt(0, 1_000_000);
  return otp.toString().padStart(6, '0');
}

module.exports = { generateOtp };
