'use strict';

/**
 * cart.service.js — Cart business logic.
 *
 * Enforces the single-restaurant rule: a cart can only contain items
 * from one restaurant at a time.
 */

const Cart = require('./cart.model');
const menuService = require('../menu/menu.service');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

/**
 * Get or create a cart for a user.
 * @param {string} userId
 */
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('restaurant', 'name isOpen isActive');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

/**
 * Add an item to the cart.
 * Enforces single-restaurant rule — clears cart if switching restaurants.
 *
 * @param {string} userId
 * @param {{ menuItemId: string, quantity: number }} params
 */
async function addItem(userId, { menuItemId, quantity }) {
  const menuItem = await menuService.getMenuItem(menuItemId);

  if (!menuItem.isAvailable) {
    throw new BusinessError('This item is currently unavailable', ERROR_CODES.ITEM_UNAVAILABLE);
  }

  const restaurantId = menuItem.restaurant.toString();
  const cart = await getOrCreateCart(userId);

  // Single-restaurant rule: clear cart if user switches restaurant
  const cartRestaurantId = cart.restaurant?.toString();
  if (cartRestaurantId && cartRestaurantId !== restaurantId) {
    throw new BusinessError(
      'Your cart has items from another restaurant. Clear the cart to add items from a new restaurant.',
      ERROR_CODES.CART_MIXED_RESTAURANT
    );
  }

  cart.restaurant = menuItem.restaurant;

  // Check if item already in cart — update quantity
  const existingItem = cart.items.find((i) => i.menuItem.toString() === menuItemId);

  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + quantity, 50);
  } else {
    cart.items.push({
      menuItem: menuItem._id,
      name: menuItem.name,     // Price snapshot
      price: menuItem.price,   // Price snapshot
      quantity,
    });
  }

  await cart.save();
  return cart;
}

/**
 * Update quantity of a cart item.
 * Setting quantity to 0 removes the item.
 */
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

/**
 * Remove a specific item from cart.
 */
async function removeItem(userId, menuItemId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError('Cart not found');

  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);

  if (cart.items.length === before) {
    throw new NotFoundError('Item not found in cart');
  }

  // Clear restaurant ref if cart is now empty
  if (!cart.items.length) {
    cart.restaurant = undefined;
    cart.appliedCoupon = undefined;
  }

  await cart.save();
  return cart;
}

/**
 * Clear all items from the cart.
 */
async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return;

  cart.items = [];
  cart.restaurant = undefined;
  cart.appliedCoupon = undefined;
  await cart.save();
  return cart;
}

/**
 * Get a user's cart with computed subtotal.
 */
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
