'use strict';

const mongoose = require('mongoose');

module.exports = mongoose.models.AuditLog || require('../audit/audit.model');
