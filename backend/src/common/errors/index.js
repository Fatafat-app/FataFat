'use strict';

const AppError = require('./AppError');
const { StatusCodes } = require('http-status-codes');
const ERROR_CODES = require('../constants/errorCodes');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = ERROR_CODES.UNAUTHORIZED) {
    super(message, StatusCodes.UNAUTHORIZED, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, StatusCodes.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = ERROR_CODES.ALREADY_EXISTS) {
    super(message, StatusCodes.CONFLICT, code);
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment failed', code = ERROR_CODES.PAYMENT_FAILED) {
    super(message, StatusCodes.PAYMENT_REQUIRED, code);
  }
}

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
