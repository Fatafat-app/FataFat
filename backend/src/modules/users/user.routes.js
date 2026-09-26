'use strict';

const { Router } = require('express');
const multer = require('multer');
const controller = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// All user routes require authentication
router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.post('/me/avatar', upload.single('avatar'), controller.uploadAvatar);

router.get('/me/addresses', controller.getAddresses);
router.post('/me/addresses', controller.addAddress);
router.patch('/me/addresses/:addressId', controller.updateAddress);
router.delete('/me/addresses/:addressId', controller.deleteAddress);

router.put('/me/fcm-token', controller.updateFcmToken);

module.exports = router;
