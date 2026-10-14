'use strict';

const { Router } = require('express');
const feedService = require('./feed.service');
const { success } = require('../../common/response/apiResponse');

const router = Router();

// GET /api/v1/feed/home
router.get('/home', async (req, res, next) => {
  try {
    const { lat, lng, isVeg } = req.query;
    const feed = await feedService.getUnifiedHomeFeed({ lat, lng, isVeg });
    return success(res, feed);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/feed/config (public read-only config)
router.get('/config', async (req, res, next) => {
  try {
    const config = await feedService.getHomeConfig();
    return success(res, config);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
