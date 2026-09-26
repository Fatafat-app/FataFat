'use strict';

const { transition, canTransition, getNextStatuses } = require('../../src/modules/orders/order.stateMachine');
const { ORDER_STATUS } = require('../../src/common/constants/orderStatuses');
const { BusinessError } = require('../../src/common/errors');

describe('Order State Machine', () => {
  let mockOrder;

  beforeEach(() => {
    mockOrder = {
      orderStatus: ORDER_STATUS.PENDING,
      timeline: [],
    };
  });

  test('allows transition from PENDING to CONFIRMED and updates timeline', () => {
    const updated = transition(mockOrder, ORDER_STATUS.CONFIRMED);
    expect(updated.orderStatus).toBe(ORDER_STATUS.CONFIRMED);
    expect(updated.timeline.length).toBe(1);
    expect(updated.timeline[0].status).toBe(ORDER_STATUS.CONFIRMED);
  });

  test('allows transition from PENDING to CANCELLED', () => {
    const updated = transition(mockOrder, ORDER_STATUS.CANCELLED);
    expect(updated.orderStatus).toBe(ORDER_STATUS.CANCELLED);
  });

  test('disallows invalid transition from PENDING to DELIVERED', () => {
    expect(() => {
      transition(mockOrder, ORDER_STATUS.DELIVERED);
    }).toThrow(BusinessError);
  });

  test('progresses full happy path lifecycle correctly', () => {
    transition(mockOrder, ORDER_STATUS.CONFIRMED);
    transition(mockOrder, ORDER_STATUS.PREPARING);
    transition(mockOrder, ORDER_STATUS.READY_FOR_PICKUP);
    transition(mockOrder, ORDER_STATUS.OUT_FOR_DELIVERY);
    transition(mockOrder, ORDER_STATUS.DELIVERED);

    expect(mockOrder.orderStatus).toBe(ORDER_STATUS.DELIVERED);
    expect(mockOrder.timeline.length).toBe(5);
  });

  test('canTransition correctly checks feasibility without mutation', () => {
    expect(canTransition(ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP)).toBe(true);
    expect(canTransition(ORDER_STATUS.PREPARING, ORDER_STATUS.DELIVERED)).toBe(false);
  });

  test('getNextStatuses returns allowed target statuses', () => {
    const next = getNextStatuses(ORDER_STATUS.PENDING);
    expect(next).toEqual([ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED]);
  });
});
