'use strict';

const Cuisine = require('./cuisine.model');
const DietaryType = require('./dietaryType.model');
const CancellationReason = require('./cancellationReason.model');
const masterService = require('./master.service');
const { masterRoutes, adminMasterRoutes } = require('./master.routes');

module.exports = {
  Cuisine,
  DietaryType,
  CancellationReason,
  masterService,
  masterRoutes,
  adminMasterRoutes,
};
