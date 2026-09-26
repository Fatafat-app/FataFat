'use strict';

const notificationService = require('./notification.service');
const { success } = require('../../common/response/apiResponse');

async function getNotifications(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await notificationService.getUserNotifications(req.user.id, { page, limit });
  return success(res, result);
}

async function markNotificationAsRead(req, res) {
  const { id } = req.params;
  const result = await notificationService.markAsRead(req.user.id, id);
  return success(res, result, 'Notification marked as read');
}

async function markAllNotificationsAsRead(req, res) {
  const result = await notificationService.markAsRead(req.user.id);
  return success(res, result, 'All notifications marked as read');
}

async function updateFcmToken(req, res) {
  const { fcmToken } = req.body;
  const result = await notificationService.updateDeviceToken(req.user.id, fcmToken);
  return success(res, result, 'Device token registered successfully');
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateFcmToken,
};
