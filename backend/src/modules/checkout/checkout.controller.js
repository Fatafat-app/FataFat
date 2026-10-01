'use strict';

const checkoutService = require('./checkout.service');
const { formatResponse } = require('../../common/response');

class CheckoutController {
  async createSession(req, res) {
    const { items, address, couponCode, paymentMethod } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;

    const result = await checkoutService.createSession({
      userId: req.user._id,
      items,
      address,
      couponCode,
      paymentMethod,
      idempotencyKey,
      actor: req.user,
    });

    return res.status(201).json(formatResponse(result));
  }

  async getSession(req, res) {
    const session = await checkoutService.getSession(req.params.id);
    return res.json(formatResponse({ session }));
  }
}

module.exports = new CheckoutController();
