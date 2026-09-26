'use strict';

const cartService = require('./cart.service');
const { success } = require('../../common/response/apiResponse');

async function getCart(req, res) {
  const cart = await cartService.getCart(req.user.id);
  success(res, { cart });
}

async function addItem(req, res) {
  const cart = await cartService.addItem(req.user.id, req.body);
  success(res, { cart }, 'Item added to cart');
}

async function updateItem(req, res) {
  const cart = await cartService.updateItemQuantity(req.user.id, req.params.menuItemId, req.body.quantity);
  success(res, { cart }, 'Cart updated');
}

async function removeItem(req, res) {
  const cart = await cartService.removeItem(req.user.id, req.params.menuItemId);
  success(res, { cart }, 'Item removed');
}

async function clearCart(req, res) {
  await cartService.clearCart(req.user.id);
  success(res, null, 'Cart cleared');
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
