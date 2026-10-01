'use strict';

const catalogService = require('./catalog.service');
const { formatResponse } = require('../../common/response');

class CatalogController {
  async getCategories(req, res) {
    const { vertical } = req.query;
    const categories = await catalogService.getCategories({ vertical });
    return res.json(formatResponse({ categories }));
  }

  async createCategory(req, res) {
    const category = await catalogService.createCategory(req.body, req.user);
    return res.status(201).json(formatResponse({ category }));
  }

  async search(req, res) {
    const { vertical, q, vendorId, categoryId, page, limit } = req.query;
    const result = await catalogService.search({
      vertical,
      q,
      vendorId,
      categoryId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.json(formatResponse(result));
  }

  async createMasterItem(req, res) {
    const item = await catalogService.createMasterItem(req.body, req.user);
    return res.status(201).json(formatResponse({ item }));
  }

  async createVendorItem(req, res) {
    const result = await catalogService.createVendorItem(req.body, req.user);
    return res.status(201).json(formatResponse(result));
  }

  async createListing(req, res) {
    const listing = await catalogService.createListing(req.body, req.user);
    return res.status(201).json(formatResponse({ listing }));
  }

  async updateListing(req, res) {
    const { version } = req.body;
    const listing = await catalogService.updateListing(
      req.params.id,
      req.body,
      req.user,
      version !== undefined ? parseInt(version, 10) : null
    );
    return res.json(formatResponse({ listing }));
  }
}

module.exports = new CatalogController();
