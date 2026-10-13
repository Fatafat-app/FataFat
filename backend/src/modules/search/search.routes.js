'use strict';

const { Router } = require('express');
const searchService = require('./search.service');
const { success } = require('../../common/response/apiResponse');

const router = Router();

router.get('/restaurants', async (req, res) => {
  const { q, lat, lng, radius } = req.query;
  const { restaurants, meta } = await searchService.searchRestaurants(
    q,
    { lat, lng, radiusKm: parseFloat(radius) || 10 },
    req.query
  );
  success(res, { restaurants }, 'Search results', 200, meta);
});

router.get('/items', async (req, res) => {
  const { q } = req.query;
  const { items, meta } = await searchService.searchMenuItems(q, req.query);
  success(res, { items, menuItems: items }, 'Item search results', 200, meta);
});

router.get('/recommended', async (req, res) => {
  const { items } = await searchService.getRecommendedItems(req.query);
  success(res, { items, products: items }, 'Recommended items', 200);
});

router.get('/under99', async (req, res) => {
  const { items } = await searchService.getUnder99Items(req.query);
  success(res, { items, products: items }, 'Under 99 items', 200);
});

module.exports = router;
