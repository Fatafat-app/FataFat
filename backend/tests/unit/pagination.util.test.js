'use strict';

const { getPagination, buildPaginationMeta } = require('../../src/common/utils/pagination');

describe('Pagination Utility', () => {
  test('returns default pagination parameters when empty query is provided', () => {
    const result = getPagination({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  test('calculates correct skip for arbitrary page and limit', () => {
    const result = getPagination({ page: '3', limit: '15' });
    expect(result).toEqual({ page: 3, limit: 15, skip: 30 });
  });

  test('enforces minimum page of 1 and max limit of 100', () => {
    const result = getPagination({ page: '-5', limit: '500' });
    expect(result).toEqual({ page: 1, limit: 100, skip: 0 });
  });

  test('builds accurate pagination metadata', () => {
    const meta = buildPaginationMeta(95, 2, 20);
    expect(meta).toEqual({
      totalCount: 95,
      totalPages: 5,
      currentPage: 2,
      perPage: 20,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  test('correctly sets hasNextPage to false on final page', () => {
    const meta = buildPaginationMeta(95, 5, 20);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });
});
