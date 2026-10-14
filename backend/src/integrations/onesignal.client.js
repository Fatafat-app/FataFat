'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Send push notification to a specific user by external userId
 * (Matches oneSignalService.login(userId) on the client)
 */
async function sendPushToUser(userId, { title, body, data = {} }) {
  if (!env.onesignal.apiKey) {
    logger.warn('[OneSignal] Missing ONESIGNAL_REST_API_KEY, skipping push');
    return null;
  }

  const payload = {
    app_id: env.onesignal.appId,
    target_channel: 'push',
    include_aliases: {
      external_id: [String(userId)],
    },
    headings: { en: title },
    contents: { en: body },
    data: data,
  };

  try {
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${env.onesignal.apiKey}`,
      },
    });

    logger.debug('[OneSignal] Push sent to user', { userId, responseData: response.data });
    return response.data;
  } catch (err) {
    logger.error('[OneSignal] Failed to send push to user', {
      userId,
      error: err.response?.data || err.message,
    });
    throw err;
  }
}

/**
 * Send broadcast push notification to all subscribed users
 */
async function sendPushToAll({ title, body, data = {} }) {
  if (!env.onesignal.apiKey) {
    logger.warn('[OneSignal] Missing ONESIGNAL_REST_API_KEY, skipping broadcast push');
    return null;
  }

  const payload = {
    app_id: env.onesignal.appId,
    included_segments: ['Total Subscriptions'],
    headings: { en: title },
    contents: { en: body },
    data: data,
  };

  try {
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${env.onesignal.apiKey}`,
      },
    });

    logger.debug('[OneSignal] Broadcast push sent', { responseData: response.data });
    return response.data;
  } catch (err) {
    logger.error('[OneSignal] Failed to send broadcast push', {
      error: err.response?.data || err.message,
    });
    throw err;
  }
}

/**
 * Send push notification to a specific OneSignal subscription ID
 */
async function sendPushToSubscription(subscriptionId, { title, body, data = {} }) {
  if (!env.onesignal.apiKey) {
    logger.warn('[OneSignal] Missing ONESIGNAL_REST_API_KEY, skipping push');
    return null;
  }

  const payload = {
    app_id: env.onesignal.appId,
    include_subscription_ids: [subscriptionId],
    headings: { en: title },
    contents: { en: body },
    data: data,
  };

  try {
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${env.onesignal.apiKey}`,
      },
    });

    logger.debug('[OneSignal] Push sent to subscription', { subscriptionId, responseData: response.data });
    return response.data;
  } catch (err) {
    logger.error('[OneSignal] Failed to send push to subscription', {
      subscriptionId,
      error: err.response?.data || err.message,
    });
    throw err;
  }
}

module.exports = {
  sendPushToUser,
  sendPushToAll,
  sendPushToSubscription,
};
