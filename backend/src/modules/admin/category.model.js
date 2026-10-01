'use strict';

const mongoose = require('mongoose');

module.exports = mongoose.models.Category || require('../catalog/category.model');
