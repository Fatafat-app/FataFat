'use strict';

const { ForbiddenError } = require('../common/errors');
const { ROLE_PERMISSIONS, ROLES } = require('../common/constants/roles');

// Expand equivalent roles (e.g. restaurant_owner === merchant_owner === merchant_staff)
const ROLE_ALIASES = {
  [ROLES.RESTAURANT_OWNER]: [ROLES.RESTAURANT_OWNER, ROLES.MERCHANT_OWNER, ROLES.MERCHANT_STAFF],
  [ROLES.MERCHANT_OWNER]: [ROLES.RESTAURANT_OWNER, ROLES.MERCHANT_OWNER, ROLES.MERCHANT_STAFF],
  [ROLES.MERCHANT_STAFF]: [ROLES.RESTAURANT_OWNER, ROLES.MERCHANT_OWNER, ROLES.MERCHANT_STAFF],
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN],
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN],
  [ROLES.OPS_ADMIN]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPS_ADMIN],
  [ROLES.DELIVERY_PARTNER]: [ROLES.DELIVERY_PARTNER, 'rider'],
};

function expandRoles(roles) {
  const expanded = new Set();
  for (const role of roles) {
    expanded.add(role);
    if (ROLE_ALIASES[role]) {
      ROLE_ALIASES[role].forEach((alias) => expanded.add(alias));
    }
  }
  return Array.from(expanded);
}

function requireRole(...roles) {
  const allowedRoles = expandRoles(roles.flat(Infinity));
  return (req, _res, next) => {
    if (!req.user) {
      throw new ForbiddenError('RBAC check run without authentication middleware');
    }

    // Super admin bypasses all role constraints
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

function requirePermission(...permissions) {
  const requiredPermissions = permissions.flat(Infinity);
  return (req, _res, next) => {
    if (!req.user) {
      throw new ForbiddenError('Permission check run without authentication middleware');
    }

    const userRole = req.user.role;
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenError(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    next();
  };
}

module.exports = { requireRole, requirePermission };
