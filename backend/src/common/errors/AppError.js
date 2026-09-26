'use strict';

/**
 * AppError.js — Base custom error class.
 *
 * All application-level errors extend this. The global error handler
 * (errorHandler.middleware.js) checks `isOperational` to decide whether
 * to send a safe client response or log an unexpected crash.
 */

class AppError extends Error {
  /**
   * @param {string} message   - Human-readable error message (sent to client)
   * @param {number} statusCode - HTTP status code
   * @param {string} [code]     - Machine-readable error code (e.g. 'ORDER_NOT_FOUND')
   * @param {Array}  [errors]   - Validation error details array
   */
  constructor(message, statusCode, code = null, errors = null) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;

    // Operational errors are expected business/user errors (4xx).
    // Non-operational errors are bugs/crashes (5xx) — logged with full stack.
    this.isOperational = statusCode < 500;

    // Capture stack trace, excluding this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
