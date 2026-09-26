'use strict';

const menuService = require('./menu.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function getMenu(req, res) {
  const isOwnerOrAdmin = req.user && ['restaurant_owner', 'admin'].includes(req.user.role);
  const menu = await menuService.getMenuByRestaurant(req.params.restaurantId, isOwnerOrAdmin);
  success(res, { menu });
}

async function addCategory(req, res) {
  const category = await menuService.addCategory(req.params.restaurantId, req.body);
  success(res, { category }, 'Category added', StatusCodes.CREATED);
}

async function updateCategory(req, res) {
  const category = await menuService.updateCategory(req.params.categoryId, req.params.restaurantId, req.body);
  success(res, { category }, 'Category updated');
}

async function addItem(req, res) {
  const item = await menuService.addMenuItem(req.params.restaurantId, req.body);
  success(res, { item }, 'Menu item added', StatusCodes.CREATED);
}

async function updateItem(req, res) {
  const item = await menuService.updateMenuItem(req.params.itemId, req.params.restaurantId, req.body);
  success(res, { item }, 'Item updated');
}

async function toggleAvailability(req, res) {
  const item = await menuService.toggleItemAvailability(req.params.itemId, req.params.restaurantId);
  success(res, { isAvailable: item.isAvailable }, item.isAvailable ? 'Item marked available' : 'Item marked unavailable');
}

module.exports = { getMenu, addCategory, updateCategory, addItem, updateItem, toggleAvailability };
