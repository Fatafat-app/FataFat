'use strict';

/**
 * pick.js — Whitelist object keys.
 *
 * Useful for extracting only the fields you need from req.body or query,
 * preventing unexpected keys from reaching service/model layers.
 *
 * @param {object}   obj  - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {object}
 */
function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

module.exports = { pick };
