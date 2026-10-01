'use strict';

const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');
const logger = require('../config/logger');
const env = require('../config/env');

function handleMongooseValidationError(err) {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed', StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
}

function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(
    `${field} '${value}' already exists`,
    StatusCodes.CONFLICT,
    ERROR_CODES.ALREADY_EXISTS
  );
}

function handleJwtError(err) {
  const code = err.name === 'TokenExpiredError' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID;
  const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
  return new AppError(message, StatusCodes.UNAUTHORIZED, code);
}

function errorHandler(err, req, res, _next) {
  let error = err;

  if (err.name === 'ValidationError' && err.errors) {
    error = handleMongooseValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJwtError(err);
  } else if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!error.isOperational) {
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
      errors: error.errors || error.details,
    });
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  const response = {
    success: false,
    message: error.isOperational ? error.message : 'An unexpected error occurred',
    code: error.code || ERROR_CODES.INTERNAL_ERROR,
  };

  if (error.errors) response.errors = error.errors;

  if (env.node.isDevelopment && !error.isOperational) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
