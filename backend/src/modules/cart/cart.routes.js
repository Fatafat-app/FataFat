'use strict';

const { Router } = require('express');
const controller = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();
router.use(authenticate); // All cart routes require auth

router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.patch('/items/:menuItemId', controller.updateItem);
router.delete('/items/:menuItemId', controller.removeItem);
router.delete('/', controller.clearCart);

module.exports = router;
