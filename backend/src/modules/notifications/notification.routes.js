'use strict';

const { Router } = require('express');
const controller = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

// GET /api/v1/notifications
router.get('/', controller.getNotifications);

// POST /api/v1/notifications/fcm-token
router.post('/fcm-token', controller.updateFcmToken);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', controller.markAllNotificationsAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', controller.markNotificationAsRead);

module.exports = router;
