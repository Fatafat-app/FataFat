'use strict';

const bannerService = require('./banner.service');
const { success } = require('../../common/response/apiResponse');

async function getBanners(req, res) {
  const { section } = req.query;
  const banners = await bannerService.getBanners(section);
  return success(res, { banners, items: banners });
}

async function getAllBannersAdmin(req, res) {
  const { section } = req.query;
  const banners = await bannerService.getAllBannersAdmin(section);
  return success(res, { banners, items: banners });
}

async function createBanner(req, res) {
  const banner = await bannerService.createBanner(req.body);
  return success(res, { banner }, 'Banner created successfully', 201);
}

async function updateBanner(req, res) {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  return success(res, { banner }, 'Banner updated successfully');
}

async function toggleBannerActive(req, res) {
  const banner = await bannerService.updateBanner(req.params.id, { isActive: req.body.isActive });
  return success(res, { banner }, `Banner ${banner.isActive ? 'activated' : 'deactivated'}`);
}

async function deleteBanner(req, res) {
  const result = await bannerService.deleteBanner(req.params.id);
  return success(res, result, 'Banner deleted successfully');
}

async function reorderBanners(req, res) {
  await bannerService.reorderBanners(req.body.items || req.body);
  return success(res, null, 'Banners reordered successfully');
}

module.exports = {
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  reorderBanners,
};
