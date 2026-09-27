'use strict';

class AppError extends Error {
  constructor(message, statusCode, code = null, errors = null) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;

    this.isOperational = statusCode < 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
