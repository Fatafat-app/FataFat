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
  success(res, { items }, 'Item search results', 200, meta);
});

module.exports = router;
