'use strict';

/**
 * firebase.client.js — Firebase Admin SDK wrapper for FCM push notifications.
 *
 * Initialised once on first import (singleton pattern).
 * All FCM operations go through this module.
 */

const admin = require('firebase-admin');
const env = require('../config/env');
const logger = require('../config/logger');

let firebaseApp = null;

function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        privateKey: env.firebase.privateKey,
        clientEmail: env.firebase.clientEmail,
      }),
    });
    logger.info('[Firebase] Admin SDK initialised');
  }
  return firebaseApp;
}

/**
 * Send a push notification to a single device.
 *
 * @param {string} fcmToken - Device FCM token
 * @param {{ title: string, body: string, data?: object }} notification
 * @returns {Promise<string>} Message ID
 */
async function sendPushNotification(fcmToken, { title, body, data = {} }) {
  const app = getFirebaseApp();

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(
      // FCM data values must be strings
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  try {
    const messageId = await app.messaging().send(message);
    logger.debug('[Firebase] Push notification sent', { messageId });
    return messageId;
  } catch (err) {
    logger.error('[Firebase] Failed to send push notification', { error: err.message, fcmToken });
    throw err;
  }
}

/**
 * Send a push notification to multiple devices (multicast).
 * Max 500 tokens per call (FCM limit).
 *
 * @param {string[]} fcmTokens
 * @param {{ title: string, body: string, data?: object }} notification
 */
async function sendMulticastNotification(fcmTokens, { title, body, data = {} }) {
  if (!fcmTokens.length) return;

  const app = getFirebaseApp();

  const message = {
    tokens: fcmTokens,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: { priority: 'high' },
  };

  try {
    const response = await app.messaging().sendEachForMulticast(message);
    logger.debug('[Firebase] Multicast sent', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return response;
  } catch (err) {
    logger.error('[Firebase] Multicast failed', { error: err.message });
    throw err;
  }
}

module.exports = { sendPushNotification, sendMulticastNotification };
