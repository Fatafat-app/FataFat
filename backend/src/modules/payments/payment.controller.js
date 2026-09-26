'use strict';

const paymentService = require('./payment.service');
const { success } = require('../../common/response/apiResponse');

async function confirmPayment(req, res) {
  const payment = await paymentService.confirmPayment(req.body, req.user.id);
  success(res, { payment }, 'Payment confirmed');
}

async function getPaymentForOrder(req, res) {
  const payment = await paymentService.getPaymentByOrder(req.params.orderId);
  success(res, { payment });
}

module.exports = { confirmPayment, getPaymentForOrder };
