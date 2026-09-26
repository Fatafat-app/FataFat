'use strict';

/**
 * auth.middleware.js — JWT access token verification.
 *
 * Reads the Bearer token from Authorization header, verifies it, and
 * attaches the decoded payload to req.user for downstream use.
 *
 * Does NOT check roles — that's rbac.middleware.js's job.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');

/**
 * Middleware: require a valid JWT access token.
 * Attaches decoded payload to req.user: { id, role, iat, exp }
 */
function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided', ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid token', ERROR_CODES.TOKEN_INVALID);
  }
}

/**
 * Middleware: optionally attach user if valid token present.
 * Does NOT throw if token is missing — use for public routes that can
 * behave differently when logged in (e.g. show personalised results).
 */
function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = decoded;
  } catch (_err) {
    // Ignore invalid/expired token on optional routes
  }

  next();
}

module.exports = { authenticate, optionalAuthenticate };
