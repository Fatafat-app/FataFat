'use strict';

const AppError = require('./AppError');
const { StatusCodes } = require('http-status-codes');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * 400 — Invalid request body, params, or query (used by validate middleware too)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
  }
}

/**
 * 401 — Missing or invalid authentication credentials
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = ERROR_CODES.UNAUTHORIZED) {
    super(message, StatusCodes.UNAUTHORIZED, code);
  }
}

/**
 * 403 — Authenticated but not allowed to perform this action
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, StatusCodes.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

/**
 * 404 — Resource not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

/**
 * 409 — Resource already exists or state conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = ERROR_CODES.ALREADY_EXISTS) {
    super(message, StatusCodes.CONFLICT, code);
  }
}

/**
 * 402 — Payment processing failure
 */
class PaymentError extends AppError {
  constructor(message = 'Payment failed', code = ERROR_CODES.PAYMENT_FAILED) {
    super(message, StatusCodes.PAYMENT_REQUIRED, code);
  }
}

/**
 * 422 — Business logic violation (valid input, invalid state)
 */
class BusinessError extends AppError {
  constructor(message, code) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, code);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PaymentError,
  BusinessError,
};
