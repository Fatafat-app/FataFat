'use strict';

const adminService = require('./admin.service');
const { success } = require('../../common/response/apiResponse');

async function getDashboard(req, res) {
  const data = await adminService.getDashboardOverview();
  return success(res, data);
}

async function listUsers(req, res) {
  const result = await adminService.listUsers(req.query);
  return success(res, result);
}

async function updateUser(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const user = await adminService.updateUserStatus(req.user.id, req.params.userId, req.body, meta);
  return success(res, { user }, 'User updated successfully');
}

async function updateRestaurant(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const restaurant = await adminService.updateRestaurantStatus(
    req.user.id,
    req.params.restaurantId,
    req.body,
    meta
  );
  return success(res, { restaurant }, 'Restaurant status updated');
}

async function getAuditLogs(req, res) {
  const result = await adminService.getAuditLogs(req.query);
  return success(res, result);
}

module.exports = {
  getDashboard,
  listUsers,
  updateUser,
  updateRestaurant,
  getAuditLogs,
};
