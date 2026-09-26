'use strict';

const restaurantService = require('./restaurant.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function createRestaurant(req, res) {
  const restaurant = await restaurantService.createRestaurant(req.user.id, req.body);
  success(res, { restaurant }, 'Restaurant created', StatusCodes.CREATED);
}

async function getRestaurant(req, res) {
  const restaurant = await restaurantService.getRestaurantById(req.params.id);
  success(res, { restaurant });
}

async function updateRestaurant(req, res) {
  const restaurant = await restaurantService.updateRestaurant(req.params.id, req.body, req.user);
  success(res, { restaurant }, 'Restaurant updated');
}

async function getNearby(req, res) {
  const { lat, lng, radius } = req.query;
  const { restaurants, meta } = await restaurantService.findNearbyRestaurants(
    { lat: parseFloat(lat), lng: parseFloat(lng), radiusKm: parseFloat(radius) || 5 },
    req.query
  );
  success(res, { restaurants }, 'Nearby restaurants', StatusCodes.OK, meta);
}

async function toggleOpen(req, res) {
  const restaurant = await restaurantService.toggleOpenStatus(req.params.id, req.user.id);
  success(res, { isOpen: restaurant.isOpen }, restaurant.isOpen ? 'Restaurant is now open' : 'Restaurant is now closed');
}

async function getMyRestaurants(req, res) {
  const restaurants = await restaurantService.getOwnerRestaurants(req.user.id);
  success(res, { restaurants });
}

module.exports = { createRestaurant, getRestaurant, updateRestaurant, getNearby, toggleOpen, getMyRestaurants };
