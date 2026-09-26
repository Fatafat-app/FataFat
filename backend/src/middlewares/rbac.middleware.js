'use strict';

/**
 * rbac.middleware.js — Role-Based Access Control.
 *
 * Usage:
 *   router.patch('/status', authenticate, requireRole(ROLES.RESTAURANT_OWNER, ROLES.ADMIN), controller.updateStatus);
 *
 * Must be used AFTER authenticate middleware (requires req.user to be set).
 */

const { ForbiddenError } = require('../common/errors');

/**
 * Factory: returns middleware that allows only the specified roles.
 * @param {...string} allowedRoles - Role strings (from common/constants/roles.js)
 * @returns {import('express').RequestHandler}
 */
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      // This is a programming error — authenticate must run before requireRole
      throw new ForbiddenError('RBAC check run without authentication middleware');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

module.exports = { requireRole };
