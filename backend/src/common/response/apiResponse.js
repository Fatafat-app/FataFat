'use strict';

const { StatusCodes } = require('http-status-codes');

function success(res, data = null, message = 'Success', statusCode = StatusCodes.OK, meta = null) {
  const body = { success: true, message };

  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;

  return res.status(statusCode).json(body);
}

function error(res, message = 'An error occurred', statusCode = StatusCodes.INTERNAL_SERVER_ERROR, code = null, errors = null) {
  const body = { success: false, message };

  if (code) body.code = code;
  if (errors) body.errors = errors;

  return res.status(statusCode).json(body);
}

module.exports = { success, error };
