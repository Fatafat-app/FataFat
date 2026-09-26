'use strict';

/**
 * user.service.js — User profile and address management.
 *
 * Handles reading and updating user data.
 * Avatar upload delegates to cloudinary.client.
 */

const User = require('./user.model');
const { uploadImage, deleteImage } = require('../../integrations/cloudinary.client');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

/**
 * Get a user's public profile by ID.
 * @param {string} userId
 */
async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/**
 * Update user profile fields.
 * Only whitelisted fields are updated.
 *
 * @param {string} userId
 * @param {{ name?: string, email?: string }} updates
 */
async function updateProfile(userId, updates) {
  const allowedFields = ['name', 'email'];
  const safeUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  }

  const user = await User.findByIdAndUpdate(userId, safeUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

/**
 * Upload and update user avatar.
 * Deletes old avatar from Cloudinary before uploading new one.
 *
 * @param {string} userId
 * @param {Buffer} imageBuffer - Raw image buffer from multer
 */
async function updateAvatar(userId, imageBuffer) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  // Delete old avatar if it exists
  if (user.avatar) {
    // Extract public_id from Cloudinary URL
    const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await deleteImage(publicId);
  }

  const { url } = await uploadImage(imageBuffer, { folder: 'ftafat/users/avatars' });
  user.avatar = url;
  await user.save();

  return user;
}

/**
 * Get all saved addresses for a user.
 * @param {string} userId
 */
async function getAddresses(userId) {
  const user = await User.findById(userId).select('addresses');
  if (!user) throw new NotFoundError('User not found');
  return user.addresses;
}

/**
 * Add a new address to user's address book.
 * If marked as default, unsets all other defaults.
 *
 * @param {string} userId
 * @param {object} addressData
 */
async function addAddress(userId, addressData) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (addressData.isDefault) {
    // Unset all existing defaults
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  // If this is the first address, make it default
  if (!user.addresses.length) {
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();

  return user.addresses[user.addresses.length - 1];
}

/**
 * Update an existing address.
 *
 * @param {string} userId
 * @param {string} addressId
 * @param {object} updates
 */
async function updateAddress(userId, addressId, updates) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const address = user.addresses.id(addressId);
  if (!address) throw new NotFoundError('Address not found');

  if (updates.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  Object.assign(address, updates);
  await user.save();

  return address;
}

/**
 * Delete an address from user's address book.
 *
 * @param {string} userId
 * @param {string} addressId
 */
async function deleteAddress(userId, addressId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const address = user.addresses.id(addressId);
  if (!address) throw new NotFoundError('Address not found');

  address.deleteOne();
  await user.save();
}

/**
 * Store FCM device token for push notifications.
 * @param {string} userId
 * @param {string} fcmToken
 */
async function updateFcmToken(userId, fcmToken) {
  await User.findByIdAndUpdate(userId, { fcmToken });
}

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateFcmToken,
};
