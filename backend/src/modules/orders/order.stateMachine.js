'use strict';

const { ORDER_STATUS } = require('../../common/constants/orderStatuses');
const { BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

const VALID_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP],
  [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.REFUNDED]: [],
});

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

  order.orderStatus = newStatus;
  order.timeline.push({ status: newStatus, timestamp: new Date() });

  return order;
}

function canTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

function getNextStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

module.exports = { transition, canTransition, getNextStatuses, VALID_TRANSITIONS };
