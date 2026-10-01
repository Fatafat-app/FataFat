'use strict';

const { Router } = require('express');
const controller = require('./checkout.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.post('/sessions', authenticate, (req, res) => controller.createSession(req, res));
router.get('/sessions/:id', authenticate, (req, res) => controller.getSession(req, res));

module.exports = router;
