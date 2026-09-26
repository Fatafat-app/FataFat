'use strict';

const analyticsService = require('./analytics.service');
const { success } = require('../../common/response/apiResponse');

async function getRestaurantAnalytics(req, res) {
  const { restaurantId } = req.params;
  const days = req.query.days ? parseInt(req.query.days, 10) : 30;
  const data = await analyticsService.getRestaurantAnalytics(restaurantId, { days });
  return success(res, data);
}

async function getPlatformAnalytics(req, res) {
  const days = req.query.days ? parseInt(req.query.days, 10) : 30;
  const data = await analyticsService.getPlatformAnalytics({ days });
  return success(res, data);
}

module.exports = {
  getRestaurantAnalytics,
  getPlatformAnalytics,
};
