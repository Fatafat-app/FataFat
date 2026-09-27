'use strict';

const { ForbiddenError } = require('../common/errors');

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
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
