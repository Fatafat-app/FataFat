'use strict';

const crypto = require('crypto');

function generateOtp() {
  const otp = crypto.randomInt(1000, 10000);
  return otp.toString();
}

module.exports = { generateOtp };
