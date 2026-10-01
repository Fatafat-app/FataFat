'use strict';

const settingsService = require('./settings.service');
const { formatResponse } = require('../../common/response');
const { PERMISSIONS } = require('../../common/constants/roles');

class SettingsController {
  async getBootstrap(_req, res) {
    const config = await settingsService.getBootstrapConfig();
    return res.json(formatResponse(config));
  }

  async getVerticals(_req, res) {
    const flags = await settingsService.getAllFlags();
    return res.json(formatResponse({ flags }));
  }

  async setVertical(req, res) {
    const { vertical } = req.params;
    const { mode, scope, message, schedule, reason } = req.body;

    const flag = await settingsService.setFeatureFlag({
      key: `vertical.${vertical}`,
      mode,
      scope,
      message,
      schedule,
      actor: req.user,
      reason,
      requestId: req.headers['x-request-id'],
    });

    return res.json(formatResponse({ flag }));
  }
}

module.exports = new SettingsController();
