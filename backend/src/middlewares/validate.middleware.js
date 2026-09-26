'use strict';

/**
 * validate.middleware.js — Zod schema validation factory.
 *
 * Usage:
 *   const { validate } = require('../middlewares/validate.middleware');
 *   router.post('/register', validate(registerSchema), controller.register);
 *
 * The schema can validate body, params, and/or query simultaneously.
 * All validation errors are collected and returned in one response.
 */

const { z } = require('zod');
const { ValidationError } = require('../common/errors');

/**
 * Factory: returns validation middleware for a Zod schema.
 *
 * @param {z.ZodObject} schema - Zod object schema with optional { body, params, query } keys
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, _res, next) => {
    const dataToValidate = {};

    if (schema.shape?.body) dataToValidate.body = req.body;
    if (schema.shape?.params) dataToValidate.params = req.params;
    if (schema.shape?.query) dataToValidate.query = req.query;

    // If schema is flat (no body/params/query wrapper), validate req.body directly
    const isWrapped = schema.shape?.body || schema.shape?.params || schema.shape?.query;
    const target = isWrapped ? dataToValidate : req.body;
    const validationSchema = isWrapped ? schema : schema;

    const result = validationSchema.safeParse(target);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    // Attach validated (and transformed) data back to req
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
