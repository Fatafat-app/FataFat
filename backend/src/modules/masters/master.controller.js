'use strict';

const masterService = require('./master.service');
const { success } = require('../../common/response/apiResponse');

// ── PUBLIC OPERATIONAL ENDPOINTS ──

async function listCuisines(req, res) {
  const items = await masterService.list('cuisines', req.query, true);
  return success(res, { cuisines: items });
}

async function listDietaryTypes(req, res) {
  const items = await masterService.list('dietary-types', req.query, true);
  return success(res, { dietaryTypes: items });
}

async function listCancellationReasons(req, res) {
  const role = req.query.role || (req.user ? req.user.role : 'customer');
  const items = await masterService.list('cancellation-reasons', { ...req.query, role }, true);
  return success(res, { cancellationReasons: items });
}

async function listFoodCategories(req, res) {
  const items = await masterService.list('categories', req.query, true);
  return success(res, { categories: items });
}

// ── ADMIN MANAGEMENT ENDPOINTS ──

async function adminListMasters(req, res) {
  const { type } = req.params;
  const items = await masterService.list(type, req.query, false);
  return success(res, { items, total: items.length });
}

async function adminGetMaster(req, res) {
  const { type, id } = req.params;
  const item = await masterService.getById(type, id);
  return success(res, { item });
}

async function adminCreateMaster(req, res) {
  const { type } = req.params;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const item = await masterService.create(type, req.body, req.user?.id, meta);
  return success(res, { item }, `${type} record created successfully`, 201);
}

async function adminUpdateMaster(req, res) {
  const { type, id } = req.params;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const item = await masterService.update(type, id, req.body, req.user?.id, meta);
  return success(res, { item }, `${type} record updated successfully`);
}

async function adminDeleteMaster(req, res) {
  const { type, id } = req.params;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const result = await masterService.delete(type, id, req.user?.id, meta);
  return success(res, result, `${type} record deleted successfully`);
}

async function adminReorderMasters(req, res) {
  const { type } = req.params;
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const items = await masterService.reorder(type, req.body.items, req.user?.id, meta);
  return success(res, { items }, `${type} records reordered successfully`);
}

module.exports = {
  listCuisines,
  listDietaryTypes,
  listCancellationReasons,
  listFoodCategories,
  adminListMasters,
  adminGetMaster,
  adminCreateMaster,
  adminUpdateMaster,
  adminDeleteMaster,
  adminReorderMasters,
};
