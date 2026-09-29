'use strict';

const { StatusCodes } = require('http-status-codes');
const groceryService = require('./grocery.service');
const { success } = require('../../common/response/apiResponse');

async function getHomeFeed(_req, res) {
  const data = await groceryService.getGroceryHomeFeed();
  return success(res, data, 'Grocery home feed fetched successfully');
}

async function getCategories(req, res) {
  const onlyActive = req.query.includeInactive !== 'true';
  const categories = await groceryService.getCategories(onlyActive);
  return success(res, { categories }, 'Categories fetched successfully');
}

async function getProducts(req, res) {
  const result = await groceryService.getProducts(req.query);
  return success(
    res,
    { products: result.products },
    'Products fetched successfully',
    StatusCodes.OK,
    {
      total: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    }
  );
}

async function getProduct(req, res) {
  const product = await groceryService.getProductByIdOrSlug(req.params.idOrSlug);
  return success(res, { product }, 'Product fetched successfully');
}

async function searchProducts(req, res) {
  const { q, limit } = req.query;
  const products = await groceryService.searchProducts(q, limit);
  return success(res, { products }, 'Search results fetched successfully');
}

async function getBanners(req, res) {
  const onlyActive = req.query.includeInactive !== 'true';
  const banners = await groceryService.getBanners(onlyActive);
  return success(res, { banners }, 'Banners fetched successfully');
}

// Admin / Manager Controllers
async function createCategory(req, res) {
  const category = await groceryService.createCategory(req.body);
  return success(res, { category }, 'Category created successfully', StatusCodes.CREATED);
}

async function updateCategory(req, res) {
  const category = await groceryService.updateCategory(req.params.id, req.body);
  return success(res, { category }, 'Category updated successfully');
}

async function deleteCategory(req, res) {
  const result = await groceryService.deleteCategory(req.params.id);
  return success(res, result, 'Category deactivated successfully');
}

async function createProduct(req, res) {
  const product = await groceryService.createProduct(req.body);
  return success(res, { product }, 'Product created successfully', StatusCodes.CREATED);
}

async function updateProduct(req, res) {
  const product = await groceryService.updateProduct(req.params.id, req.body);
  return success(res, { product }, 'Product updated successfully');
}

async function toggleProductAvailability(req, res) {
  const product = await groceryService.toggleProductAvailability(req.params.id);
  return success(
    res,
    { isAvailable: product.isAvailable },
    product.isAvailable ? 'Product marked available' : 'Product marked unavailable'
  );
}

async function deleteProduct(req, res) {
  const result = await groceryService.deleteProduct(req.params.id);
  return success(res, result, 'Product deleted successfully');
}

async function createBanner(req, res) {
  const banner = await groceryService.createBanner(req.body);
  return success(res, { banner }, 'Banner created successfully', StatusCodes.CREATED);
}

async function updateBanner(req, res) {
  const banner = await groceryService.updateBanner(req.params.id, req.body);
  return success(res, { banner }, 'Banner updated successfully');
}

async function deleteBanner(req, res) {
  const result = await groceryService.deleteBanner(req.params.id);
  return success(res, result, 'Banner deleted successfully');
}

module.exports = {
  getHomeFeed,
  getCategories,
  getProducts,
  getProduct,
  searchProducts,
  getBanners,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
  createBanner,
  updateBanner,
  deleteBanner,
};
