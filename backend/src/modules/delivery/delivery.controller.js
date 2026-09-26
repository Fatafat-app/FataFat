'use strict';

const deliveryService = require('./delivery.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function registerPartner(req, res) {
  const partner = await deliveryService.registerPartner(req.user.id, req.body);
  return success(res, { partner }, 'Delivery partner registered successfully', StatusCodes.CREATED);
}

async function getProfile(req, res) {
  const partner = await deliveryService.getPartnerByUserId(req.user.id);
  return success(res, { partner });
}

async function toggleOnline(req, res) {
  const { isOnline } = req.body;
  const partner = await deliveryService.toggleOnlineStatus(req.user.id, isOnline);
  return success(res, { partner }, `Partner is now ${isOnline ? 'online' : 'offline'}`);
}

async function updateLocation(req, res) {
  const result = await deliveryService.updateLocation(req.user.id, req.body);
  return success(res, result);
}

async function findNearbyRiders(req, res) {
  const lng = parseFloat(req.query.lng);
  const lat = parseFloat(req.query.lat);
  const radius = req.query.radius ? parseInt(req.query.radius, 10) : 5000;
  const riders = await deliveryService.findNearbyAvailableRiders(lng, lat, radius);
  return success(res, { riders });
}

async function assignOrder(req, res) {
  const { orderId, partnerId } = req.body;
  const result = await deliveryService.assignOrder(orderId, partnerId);
  return success(res, result, 'Order assigned to partner');
}

async function updateDeliveryStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;
  const result = await deliveryService.updateDeliveryStatus(req.user.id, orderId, status);
  return success(res, result, 'Delivery status updated');
}

async function getDeliveryHistory(req, res) {
  const history = await deliveryService.getDeliveryHistory(req.user.id, req.query);
  return success(res, history);
}

module.exports = {
  registerPartner,
  getProfile,
  toggleOnline,
  updateLocation,
  findNearbyRiders,
  assignOrder,
  updateDeliveryStatus,
  getDeliveryHistory,
};
