'use strict';

/**
 * order.stateMachine.js — Order status transition enforcement.
 *
 * This is the single authoritative source of valid order state transitions.
 * No other file may directly change order status — they must call transition().
 *
 * Valid transitions:
 *   pending → confirmed | cancelled
 *   confirmed → preparing | cancelled
 *   preparing → ready_for_pickup
 *   ready_for_pickup → out_for_delivery
 *   out_for_delivery → delivered
 *   delivered → refunded (edge case: post-delivery refund)
 *   cancelled → refunded
 */

const { ORDER_STATUS } = require('../../common/constants/orderStatuses');
const { BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

/** Map of status → allowed next statuses */
const VALID_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP],
  [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.REFUNDED]: [], // Terminal state
});

/**
 * Validate and apply a status transition.
 * Throws BusinessError if the transition is invalid.
 *
 * @param {import('mongoose').Document} order - Mongoose order document
 * @param {string} newStatus - Target status
 * @returns {import('mongoose').Document} Updated (unsaved) order document
 */
function transition(order, newStatus) {
  const currentStatus = order.orderStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed) {
    throw new BusinessError(
      `Unknown order status: ${currentStatus}`,
      ERROR_CODES.ORDER_INVALID_TRANSITION
    );
  }

  if (!allowed.includes(newStatus)) {
    throw new BusinessError(
      `Cannot transition order from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      ERROR_CODES.ORDER_INVALID_TRANSITION
    );
  }

  // Apply the transition
  order.orderStatus = newStatus;
  order.timeline.push({ status: newStatus, timestamp: new Date() });

  return order;
}

/**
 * Check if a transition is valid without applying it.
 * Useful for conditional UI rendering.
 */
function canTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Get all valid next statuses for a given status.
 */
function getNextStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

module.exports = { transition, canTransition, getNextStatuses, VALID_TRANSITIONS };
