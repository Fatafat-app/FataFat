'use strict';

const userService = require('./user.service');
const { success } = require('../../common/response/apiResponse');
const { StatusCodes } = require('http-status-codes');

async function getMe(req, res) {
  const user = await userService.getProfile(req.user.id);
  success(res, { user });
}

async function updateMe(req, res) {
  const user = await userService.updateProfile(req.user.id, req.body);
  success(res, { user }, 'Profile updated');
}

async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
  }
  const user = await userService.updateAvatar(req.user.id, req.file.buffer);
  success(res, { avatar: user.avatar }, 'Avatar updated');
}

async function getAddresses(req, res) {
  const addresses = await userService.getAddresses(req.user.id);
  success(res, { addresses });
}

async function addAddress(req, res) {
  const address = await userService.addAddress(req.user.id, req.body);
  success(res, { address }, 'Address added', StatusCodes.CREATED);
}

async function updateAddress(req, res) {
  const address = await userService.updateAddress(req.user.id, req.params.addressId, req.body);
  success(res, { address }, 'Address updated');
}

async function deleteAddress(req, res) {
  await userService.deleteAddress(req.user.id, req.params.addressId);
  success(res, null, 'Address deleted');
}

async function updateFcmToken(req, res) {
  await userService.updateFcmToken(req.user.id, req.body.fcmToken);
  success(res, null, 'FCM token updated');
}

module.exports = { getMe, updateMe, uploadAvatar, getAddresses, addAddress, updateAddress, deleteAddress, updateFcmToken };
