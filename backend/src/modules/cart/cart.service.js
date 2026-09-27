'use strict';

const Cart = require('./cart.model');
const menuService = require('../menu/menu.service');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('restaurant', 'name isOpen isActive');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function addItem(userId, { menuItemId, quantity }) {
  const menuItem = await menuService.getMenuItem(menuItemId);

  if (!menuItem.isAvailable) {
    throw new BusinessError('This item is currently unavailable', ERROR_CODES.ITEM_UNAVAILABLE);
  }

  const restaurantId = menuItem.restaurant.toString();
  const cart = await getOrCreateCart(userId);

  const cartRestaurantId = cart.restaurant?.toString();
  if (cartRestaurantId && cartRestaurantId !== restaurantId) {
    throw new BusinessError(
      'Your cart has items from another restaurant. Clear the cart to add items from a new restaurant.',
      ERROR_CODES.CART_MIXED_RESTAURANT
    );
  }

  cart.restaurant = menuItem.restaurant;

  const existingItem = cart.items.find((i) => i.menuItem.toString() === menuItemId);

  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + quantity, 50);
  } else {
    cart.items.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  await cart.save();
  return cart;
}

async function updateItemQuantity(userId, menuItemId, quantity) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError('Cart not found');

  if (quantity === 0) {
    return removeItem(userId, menuItemId);
  }

  const item = cart.items.find((i) => i.menuItem.toString() === menuItemId);
  if (!item) throw new NotFoundError('Item not found in cart');

  item.quantity = Math.min(quantity, 50);
  await cart.save();
  return cart;
}

async function removeItem(userId, menuItemId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError('Cart not found');

  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);

  if (cart.items.length === before) {
    throw new NotFoundError('Item not found in cart');
  }

  if (!cart.items.length) {
    cart.restaurant = undefined;
    cart.appliedCoupon = undefined;
  }

  await cart.save();
  return cart;
}

async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return;

  cart.items = [];
  cart.restaurant = undefined;
  cart.appliedCoupon = undefined;
  await cart.save();
  return cart;
}

async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId })
    .populate('restaurant', 'name isOpen deliveryInfo')
    .populate('items.menuItem', 'name price isAvailable images');

  if (!cart) {
    return { items: [], subtotal: 0 };
  }

  return cart;
}

module.exports = {
  getOrCreateCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  getCart,
};
