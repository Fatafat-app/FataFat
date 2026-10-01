'use strict';

const catalogService = require('./catalog.service');
const CatalogItem = require('./catalogItem.model');
const VendorListing = require('./vendorListing.model');
const Category = require('./category.model');

module.exports = {
  catalogService,
  CatalogItem,
  VendorListing,
  Category,
};
