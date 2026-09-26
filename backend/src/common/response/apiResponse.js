'use strict';

/**
 * apiResponse.js — Standard API response formatter.
 *
 * Every controller uses these two functions to ensure consistent
 * response shapes across the entire API.
 *
 * Success shape:
 *   { success: true, message, data, meta }
 *
 * Error shape:
 *   { success: false, message, code, errors }
 */

const { StatusCodes } = require('http-status-codes');

/**
 * Send a successful response.
 *
 * @param {import('express').Response} res
 * @param {*}      data       - Response payload
 * @param {string} [message]  - Human-readable success message
 * @param {number} [statusCode] - HTTP status (default 200)
 * @param {object} [meta]     - Pagination or extra metadata
 */
function success(res, data = null, message = 'Success', statusCode = StatusCodes.OK, meta = null) {
  const body = { success: true, message };

  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;

  return res.status(statusCode).json(body);
}

/**
 * Send an error response.
 * NOTE: Prefer using the global error handler — call this directly only
 * when you need to send a non-throwing error (e.g. partial batch results).
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode]
 * @param {string} [code]    - Machine-readable error code
 * @param {Array}  [errors]  - Validation error details
 */
function error(res, message = 'An error occurred', statusCode = StatusCodes.INTERNAL_SERVER_ERROR, code = null, errors = null) {
  const body = { success: false, message };

  if (code) body.code = code;
  if (errors) body.errors = errors;

  return res.status(statusCode).json(body);
}

module.exports = { success, error };
