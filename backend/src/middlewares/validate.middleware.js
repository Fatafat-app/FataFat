'use strict';

const { z } = require('zod');
const { ValidationError } = require('../common/errors');

function validate(schema) {
  return (req, _res, next) => {
    const dataToValidate = {};

    if (schema.shape?.body) dataToValidate.body = req.body;
    if (schema.shape?.params) dataToValidate.params = req.params;
    if (schema.shape?.query) dataToValidate.query = req.query;

    const isWrapped = schema.shape?.body || schema.shape?.params || schema.shape?.query;
    const target = isWrapped ? dataToValidate : req.body;
    const validationSchema = isWrapped ? schema : schema;

    const result = validationSchema.safeParse(target);

    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const errors = issues.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message || 'Invalid value',
      }));
      throw new ValidationError('Validation failed', errors);
    }

    if (isWrapped) {
      if (result.data.body) req.body = result.data.body;
      if (result.data.params) req.params = result.data.params;
      if (result.data.query) req.query = result.data.query;
    } else {
      req.body = result.data;
    }

    next();
  };
}

module.exports = { validate };
