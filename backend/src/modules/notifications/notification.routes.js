'use strict';

const { Router } = require('express');
const controller = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', controller.getNotifications);

router.post('/fcm-token', controller.updateFcmToken);

router.patch('/read-all', controller.markAllNotificationsAsRead);

router.patch('/:id/read', controller.markNotificationAsRead);

module.exports = router;
