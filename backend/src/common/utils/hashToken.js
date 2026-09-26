'use strict';

const crypto = require('crypto');

/**
 * hashToken.js — One-way SHA-256 hash for tokens stored in DB.
 *
 * Refresh tokens are stored hashed in the DB so that if the DB is
 * compromised, raw tokens are not exposed.
 *
 * Usage:
 *   const hashed = hashToken(rawRefreshToken);
 *   // Store `hashed` in DB, send `raw` to client
 */

/**
 * SHA-256 hash a string token.
 * @param {string} token - Raw token string
 * @returns {string}     - Hex-encoded hash
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashToken };
