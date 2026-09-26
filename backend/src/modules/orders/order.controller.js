'use strict';

const orderService = require('./order.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function placeOrder(req, res) {
  const result = await orderService.placeOrder(req.user.id, req.body);
  success(res, result, 'Order placed successfully', StatusCodes.CREATED);
}

async function getOrder(req, res) {
  const order = await orderService.getOrderById(req.params.id, req.user);
  success(res, { order });
}

async function getMyOrders(req, res) {
  const { orders, meta } = await orderService.getUserOrders(req.user.id, req.query);
  success(res, { orders }, 'Orders retrieved', StatusCodes.OK, meta);
}

async function getRestaurantOrders(req, res) {
  const { orders, meta } = await orderService.getRestaurantOrders(req.params.restaurantId, req.query);
  success(res, { orders }, 'Restaurant orders retrieved', StatusCodes.OK, meta);
}

async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user);
  success(res, { order }, 'Order status updated');
}

module.exports = { placeOrder, getOrder, getMyOrders, getRestaurantOrders, updateStatus };
