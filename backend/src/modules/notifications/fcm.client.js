'use strict';

/**
 * fcm.client.js — Module-level export for FCM operations.
 * Proxies through integrations/firebase.client.js.
 */

const { sendPushNotification, sendMulticastNotification } = require('../../integrations/firebase.client');

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
};
