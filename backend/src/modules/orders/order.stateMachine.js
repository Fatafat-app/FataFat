'use strict';

const { ORDER_STATUS } = require('../../common/constants/orderStatuses');
const { BusinessError, ForbiddenError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');
const auditService = require('../audit');
const outboxService = require('../outbox');

// Support both lowercase and V2 uppercase
const VALID_TRANSITIONS = Object.freeze({
  // Legacy / Lowercase Keys
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.REFUNDED]: [],

  // V2 Uppercase Keys
  [ORDER_STATUS.PAYMENT_PENDING]: [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.EXPIRED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ACCEPTED]: [
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.READY]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PICKED_UP]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.FAILED_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.FAILED_DELIVERY]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.REJECTED]: [],
  [ORDER_STATUS.EXPIRED]: [],
});

/**
 * Validates whether the actor has authorization to perform the transition
 */
function validateActorPermission(fromStatus, toStatus, actor, reason) {
  const role = actor?.role || 'system';
  const isAdmin = ['super_admin', 'ops_admin', 'admin'].includes(role);

  if (isAdmin || role === 'system' || role === 'webhook') {
    return true;
  }

  if (role === 'customer') {
    if ((fromStatus === ORDER_STATUS.PENDING || fromStatus === ORDER_STATUS.PLACED) && toStatus === ORDER_STATUS.CANCELLED) {
      return true;
    }
    throw new ForbiddenError(`Customer cannot transition order from '${fromStatus}' to '${toStatus}'`);
  }

  if (role === 'merchant_owner' || role === 'merchant_staff' || role === 'restaurant_owner') {
    if (
      (fromStatus === ORDER_STATUS.PENDING || fromStatus === ORDER_STATUS.PLACED) &&
      (toStatus === ORDER_STATUS.CONFIRMED || toStatus === ORDER_STATUS.ACCEPTED || toStatus === ORDER_STATUS.REJECTED)
    ) {
      return true;
    }
    if (
      (fromStatus === ORDER_STATUS.CONFIRMED || fromStatus === ORDER_STATUS.ACCEPTED) &&
      (toStatus === ORDER_STATUS.PREPARING || toStatus === ORDER_STATUS.READY_FOR_PICKUP || toStatus === ORDER_STATUS.READY)
    ) {
      return true;
    }
    if (
      fromStatus === ORDER_STATUS.PREPARING &&
      (toStatus === ORDER_STATUS.READY_FOR_PICKUP || toStatus === ORDER_STATUS.READY)
    ) {
      return true;
    }
    if (toStatus === ORDER_STATUS.CANCELLED && reason) {
      return true;
    }
    throw new ForbiddenError(`Merchant cannot transition order from '${fromStatus}' to '${toStatus}'`);
  }

  if (role === 'delivery_partner' || role === 'rider') {
    if (
      (fromStatus === ORDER_STATUS.READY_FOR_PICKUP || fromStatus === ORDER_STATUS.READY) &&
      (toStatus === ORDER_STATUS.OUT_FOR_DELIVERY || toStatus === ORDER_STATUS.PICKED_UP)
    ) {
      return true;
    }
    if (
      (fromStatus === ORDER_STATUS.OUT_FOR_DELIVERY || fromStatus === ORDER_STATUS.PICKED_UP) &&
      (toStatus === ORDER_STATUS.DELIVERED || toStatus === ORDER_STATUS.FAILED_DELIVERY)
    ) {
      return true;
    }
    throw new ForbiddenError(`Rider cannot transition order from '${fromStatus}' to '${toStatus}'`);
  }

  throw new ForbiddenError(`Role '${role}' is not allowed to trigger transition`);
}

function getAllowedTransitions(currentStatus) {
  if (!currentStatus) return [];
  if (VALID_TRANSITIONS[currentStatus]) return VALID_TRANSITIONS[currentStatus];
  const upper = String(currentStatus).toUpperCase();
  const lower = String(currentStatus).toLowerCase();
  if (VALID_TRANSITIONS[upper]) return VALID_TRANSITIONS[upper];
  if (VALID_TRANSITIONS[lower]) return VALID_TRANSITIONS[lower];
  return [];
}

function canTransition(currentStatus, newStatus) {
  const allowed = getAllowedTransitions(currentStatus);
  return allowed.some((s) => String(s).toLowerCase() === String(newStatus).toLowerCase());
}

function getNextStatuses(currentStatus) {
  return getAllowedTransitions(currentStatus);
}

/**
 * Execute state transition on an Order
 */
function transition(order, requestedStatus, { actor = { role: 'system' }, reason = null, meta = {}, session = null } = {}) {
  const currentStatus = order.orderStatus || order.status || 'pending';
  const allowed = getAllowedTransitions(currentStatus);
  const isAdmin = ['super_admin', 'ops_admin', 'admin'].includes(actor?.role);

  let targetStatus = requestedStatus;
  const matchedAllowed = allowed.find((s) => String(s).toLowerCase() === String(requestedStatus).toLowerCase());

  if (matchedAllowed) {
    targetStatus = matchedAllowed;
  } else if (isAdmin) {
    targetStatus = requestedStatus;
  } else {
    throw new BusinessError(
      `Cannot transition order from '${currentStatus}' to '${requestedStatus}'. ` +
        `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      ERROR_CODES.ORDER_INVALID_TRANSITION
    );
  }

  validateActorPermission(currentStatus, targetStatus, actor, reason);

  const prevVersion = order.version || 1;
  order.orderStatus = targetStatus;
  order.status = targetStatus;
  order.version = prevVersion + 1;

  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    status: targetStatus,
    timestamp: new Date(),
    at: new Date(),
    actor: { id: actor.id || actor._id || null, role: actor.role || 'system' },
    reason,
    meta,
    override: isAdmin,
  });

  if (order._id) {
    try {
      auditService.log(
        {
          actor,
          action: `ORDER_TRANSITION_${targetStatus}`,
          entity: { type: 'Order', id: order._id },
          before: { status: currentStatus, version: prevVersion },
          after: { status: targetStatus, version: order.version },
          reason,
        },
        session
      );

      const eventName = `order.${String(targetStatus).toLowerCase()}.v1`;
      outboxService.record(
        {
          eventName,
          aggregateType: 'Order',
          aggregateId: order._id,
          payload: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            vendorId: order.vendorId || order.restaurant,
            customerId: order.customerId || order.user,
            vertical: order.vertical,
            status: targetStatus,
            previousStatus: currentStatus,
            actorRole: actor.role,
            reason,
            meta,
          },
        },
        session
      );
    } catch (auditErr) {
      // Audit/Outbox record notice (non-fatal)
    }
  }

  return order;
}

module.exports = {
  transition,
  canTransition,
  getNextStatuses,
  VALID_TRANSITIONS,
  validateActorPermission,
};
