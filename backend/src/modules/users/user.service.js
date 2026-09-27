'use strict';

const User = require('./user.model');
const { uploadImage, deleteImage } = require('../../integrations/cloudinary.client');
const { NotFoundError, BusinessError } = require('../../common/errors');
const ERROR_CODES = require('../../common/constants/errorCodes');

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

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

async function updateAvatar(userId, imageBuffer) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.avatar) {
    const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await deleteImage(publicId);
  }

  const { url } = await uploadImage(imageBuffer, { folder: 'ftafat/users/avatars' });
  user.avatar = url;
  await user.save();

  return user;
}

async function getAddresses(userId) {
  const user = await User.findById(userId).select('addresses');
  if (!user) throw new NotFoundError('User not found');
  return user.addresses;
}

async function addAddress(userId, addressData) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (addressData.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  if (!user.addresses.length) {
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();

  return user.addresses[user.addresses.length - 1];
}

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

async function deleteAddress(userId, addressId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const address = user.addresses.id(addressId);
  if (!address) throw new NotFoundError('Address not found');

  address.deleteOne();
  await user.save();
}

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
