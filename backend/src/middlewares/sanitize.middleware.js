'use strict';

/**
 * sanitize.middleware.js — Input sanitization against injection attacks.
 *
 * 1. express-mongo-sanitize: strips $ and . from keys to prevent NoSQL injection
 * 2. Manual XSS sanitization via escaping HTML chars in string values
 *
 * Applied globally BEFORE any route handler receives input.
 */

const mongoSanitize = require('express-mongo-sanitize');

/**
 * Recursively escape HTML special characters in string values.
 * This is a lightweight defense — for rich text, use a proper HTML sanitizer.
 */
function escapeHtml(value) {
  if (typeof value === 'string') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value)) {
      value[key] = escapeHtml(value[key]);
    }
  }
  return value;
}

/**
 * XSS sanitization middleware — escapes HTML in req.body, query, and params.
 */
function xssSanitize(req, _res, next) {
  if (req.body) req.body = escapeHtml(req.body);
  if (req.query) req.query = escapeHtml(req.query);
  if (req.params) req.params = escapeHtml(req.params);
  next();
}

// NoSQL injection protection: strips $ and . from all input keys
const noSqlSanitize = mongoSanitize({
  replaceWith: '_',    // Replace instead of remove for better debugging
  onSanitizeError: () => {}, // Silent — attacker shouldn't know it was caught
});

module.exports = { noSqlSanitize, xssSanitize };
