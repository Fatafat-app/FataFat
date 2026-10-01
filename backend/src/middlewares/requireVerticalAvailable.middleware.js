'use strict';

const settingsService = require('../modules/settings/settings.service');
const { BusinessError } = require('../common/errors');
const ERROR_CODES = require('../common/constants/errorCodes');

/**
 * Middleware factory to enforce vertical availability
 * @param {string|((req: import('express').Request) => string)} verticalExtractor
 */
function requireVerticalAvailable(verticalExtractor) {
  return async (req, _res, next) => {
    const vertical =
      typeof verticalExtractor === 'function' ? verticalExtractor(req) : verticalExtractor;

    if (!vertical) {
      return next();
    }

    const zoneId = req.body?.zoneId || req.query?.zoneId || req.user?.zoneId;
    const vendorId = req.body?.vendorId || req.params?.vendorId || req.params?.restaurantId;

    const check = await settingsService.isVerticalAvailable(vertical, { zoneId, vendorId });

    if (!check.available) {
      throw new BusinessError(
        check.message?.body || `The ${vertical} service is currently unavailable.`,
        ERROR_CODES.VERTICAL_UNAVAILABLE,
        423,
        {
          vertical,
          mode: check.mode,
          message: check.message,
        }
      );
    }

    next();
  };
}

module.exports = { requireVerticalAvailable };
