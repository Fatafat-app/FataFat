'use strict';

const { Router } = require('express');
const reviewService = require('./review.service');
const { success } = require('../../common/response/apiResponse');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/v1/reviews
router.post('/', authenticate, async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  success(res, { review }, 'Review submitted', 201);
});

// GET /api/v1/restaurants/:restaurantId/reviews
// (Also mounted from restaurant routes — this handles direct access)
router.get('/restaurant/:restaurantId', async (req, res) => {
  const { reviews, meta } = await reviewService.getRestaurantReviews(req.params.restaurantId, req.query);
  success(res, { reviews }, 'Reviews retrieved', 200, meta);
});

module.exports = router;
