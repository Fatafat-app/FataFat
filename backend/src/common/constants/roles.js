'use strict';

/**
 * constants/roles.js — User role constants.
 *
 * Single source of truth for role names used in RBAC middleware,
 * user schema enum, and route protection.
 */

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  RESTAURANT_OWNER: 'restaurant_owner',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
});

module.exports = ROLES;
