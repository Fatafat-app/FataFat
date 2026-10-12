'use strict';

const mongoose = require('mongoose');
const { createMasterSchema } = require('./master.schema');

const dietaryTypeSchema = createMasterSchema({
  colorCode: {
    type: String,
    trim: true,
    default: '#059669', // Default green
  },
  badgeIcon: {
    type: String,
    trim: true,
    default: 'leaf',
  },
  isVeg: {
    type: Boolean,
    default: true,
    index: true,
  },
});

const DietaryType = mongoose.models.DietaryType || mongoose.model('DietaryType', dietaryTypeSchema);
module.exports = DietaryType;
