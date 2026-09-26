'use strict';

const { Router } = require('express');
const controller = require('./support.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../common/constants/roles');

const router = Router();

router.use(authenticate);

// User & Restaurant routes
router.post('/', controller.createTicket);
router.get('/', controller.listTickets);
router.get('/:id', controller.getTicket);
router.post('/:id/reply', controller.replyTicket);

// Admin only status & agent management
router.patch('/:id/status', requireRole([ROLES.ADMIN]), controller.updateStatus);

module.exports = router;
