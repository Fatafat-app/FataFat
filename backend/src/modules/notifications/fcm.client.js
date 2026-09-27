'use strict';

const { sendPushNotification, sendMulticastNotification } = require('../../integrations/firebase.client');

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
};
