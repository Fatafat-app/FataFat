'use strict';

/**
 * errorHandler.middleware.js — Global Express error handler.
 *
 * Catches every error thrown or passed to next(err) in the app.
 * Must be the LAST middleware registered in app.js.
 *
 * Rules:
 * - Operational errors (AppError, isOperational=true): send structured client response
 * - Mongoose validation errors: convert to 400 + field-level detail
 * - Mongoose duplicate key (11000): convert to 409 Conflict
 * - JWT errors: convert to 401
 * - Everything else: log full stack, send generic 500 (no internals leaked in prod)
 */

const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');
const logger = require('../config/logger');
const env = require('../config/env');

/**
 * Convert Mongoose ValidationError to our AppError shape.
 */
function handleMongooseValidationError(err) {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed', StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
}

/**
 * Convert MongoDB duplicate key error (code 11000) to ConflictError.
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(
    `${field} '${value}' already exists`,
    StatusCodes.CONFLICT,
    ERROR_CODES.ALREADY_EXISTS
  );
}

/**
 * Convert JWT errors to UnauthorizedError shape.
 */
function handleJwtError(err) {
  const code = err.name === 'TokenExpiredError' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID;
  const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
  return new AppError(message, StatusCodes.UNAUTHORIZED, code);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  // Normalise known non-AppError types
  if (err.name === 'ValidationError' && err.errors) {
    error = handleMongooseValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJwtError(err);
  } else if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  // Log with appropriate severity
  if (!error.isOperational) {
    // Unexpected error — log full stack for debugging
    logger.error('[Unhandled Error]', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.id,
    });
  } else {
    logger.warn('[Operational Error]', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      url: req.originalUrl,
    });
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  const response = {
    success: false,
    message: error.isOperational ? error.message : 'An unexpected error occurred',
    code: error.code || ERROR_CODES.INTERNAL_ERROR,
  };

  if (error.errors) response.errors = error.errors;

  // Only include stack trace in development
  if (env.node.isDevelopment && !error.isOperational) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
