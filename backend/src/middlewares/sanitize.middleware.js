'use strict';

const mongoSanitize = require('express-mongo-sanitize');

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

function xssSanitize(req, _res, next) {
  if (req.body) req.body = escapeHtml(req.body);
  if (req.query) req.query = escapeHtml(req.query);
  if (req.params) req.params = escapeHtml(req.params);
  next();
}

const noSqlSanitize = mongoSanitize({
  replaceWith: '_',
  onSanitizeError: () => {},
});

module.exports = { noSqlSanitize, xssSanitize };
