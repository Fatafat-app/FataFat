'use strict';

const apiResponse = require('./apiResponse');

function formatResponse(data = null, message = 'Success', meta = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return body;
}

module.exports = {
  ...apiResponse,
  formatResponse,
};
