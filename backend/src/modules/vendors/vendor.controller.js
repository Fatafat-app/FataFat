'use strict';

const vendorService = require('./vendor.service');
const { formatResponse } = require('../../common/response');

class VendorController {
  async list(req, res) {
    const { vertical, type, isOpen, page, limit, lat, lng, radiusM } = req.query;
    const result = await vendorService.list({
      vertical,
      type,
      isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      lat,
      lng,
      radiusM,
    });
    return res.json(formatResponse(result));
  }

  async getById(req, res) {
    const vendor = await vendorService.getById(req.params.id);
    return res.json(formatResponse({ vendor }));
  }

  async create(req, res) {
    const vendor = await vendorService.create(req.body, req.user);
    return res.status(201).json(formatResponse({ vendor }));
  }

  async update(req, res) {
    const vendor = await vendorService.update(req.params.id, req.body, req.user);
    return res.json(formatResponse({ vendor }));
  }

  async pause(req, res) {
    const { pausedUntil, pauseReason } = req.body;
    const vendor = await vendorService.pauseVendor(req.params.id, {
      pausedUntil,
      pauseReason,
      actor: req.user,
    });
    return res.json(formatResponse({ vendor }));
  }

  async resume(req, res) {
    const vendor = await vendorService.resumeVendor(req.params.id, req.user);
    return res.json(formatResponse({ vendor }));
  }
}

module.exports = new VendorController();
