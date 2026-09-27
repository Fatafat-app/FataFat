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

async function listRestaurants(req, res) {
  const restaurantService = require('../restaurants/restaurant.service');
  const result = await restaurantService.listRestaurants(req.query);
  return success(res, result);
}

async function getAuditLogs(req, res) {
  const result = await adminService.getAuditLogs(req.query);
  return success(res, result);
}

async function getFees(req, res) {
  const config = await adminService.getFeeConfig();
  return success(res, { config });
}

async function updateFees(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const config = await adminService.updateFeeConfig(req.user.id, req.body, meta);
  return success(res, { config }, 'Fee configuration updated successfully');
}

async function listCategories(req, res) {
  const onlyActive = req.query.onlyActive === 'true';
  const categories = await adminService.getCategories(onlyActive);
  return success(res, { categories }, 'Categories retrieved successfully');
}

async function createCategory(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const category = await adminService.createCategory(req.user.id, req.body, meta);
  return success(res, { category }, 'Category created successfully');
}

async function updateCategory(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const category = await adminService.updateCategory(req.user.id, req.params.id, req.body, meta);
  return success(res, { category }, 'Category updated successfully');
}

async function deleteCategory(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  await adminService.deleteCategory(req.user.id, req.params.id, meta);
  return success(res, null, 'Category deleted successfully');
}

async function reorderCategories(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const categories = await adminService.reorderCategories(req.user.id, req.body.items, meta);
  return success(res, { categories }, 'Categories reordered successfully');
}

async function sendNotification(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const result = await adminService.sendNotificationBroadcast(req.user.id, req.body, meta);
  return success(res, result, 'Notification sent successfully');
}

async function getNotificationHistory(req, res) {
  const result = await adminService.getNotificationHistory(req.query);
  return success(res, result, 'Notification history retrieved');
}

module.exports = {
  getDashboard,
  listUsers,
  updateUser,
  listRestaurants,
  updateRestaurant,
  getAuditLogs,
  getFees,
  updateFees,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  sendNotification,
  getNotificationHistory,
};
