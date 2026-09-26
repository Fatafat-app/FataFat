'use strict';

/**
 * pagination.js — Pagination helpers.
 *
 * Extracts page/limit from query params with safe defaults and
 * builds a meta object for API responses.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Extract and sanitise pagination params from req.query.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function getPagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build pagination meta for API responses.
 * @param {number} totalCount  - Total number of documents
 * @param {number} page        - Current page
 * @param {number} limit       - Items per page
 * @returns {object}
 */
function buildPaginationMeta(totalCount, page, limit) {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    perPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { getPagination, buildPaginationMeta };
