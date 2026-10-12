'use strict';

const mongoose = require('mongoose');
const { createMasterSchema } = require('./master.schema');

const cuisineSchema = createMasterSchema({
  coverImage: {
    type: String,
    trim: true,
    default: '',
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true,
  },
});

const Cuisine = mongoose.models.Cuisine || mongoose.model('Cuisine', cuisineSchema);
module.exports = Cuisine;
