'use strict';

/**
 * webhook.verify.js — Webhook signature verification helper.
 *
 * Provides standalone utility functions to verify webhook signatures.
 */

const { verifyWebhookSignature } = require('../../integrations/razorpay.client');

module.exports = {
  verifyWebhookSignature,
};
