'use strict';

/**
 * cloudinary.client.js — Cloudinary SDK wrapper.
 *
 * All image upload/delete operations go through this module.
 * Multer handles multipart parsing — this handles cloud storage.
 */

const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const logger = require('../config/logger');

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true, // Always use HTTPS
});

/**
 * Upload an image buffer or file path to Cloudinary.
 *
 * @param {Buffer|string} source  - File buffer or local file path
 * @param {object} options        - Cloudinary upload options
 * @param {string} options.folder - Cloudinary folder (e.g. 'users/avatars')
 * @param {string} [options.publicId] - Override public_id
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadImage(source, { folder, publicId } = {}) {
  const uploadOptions = {
    folder,
    public_id: publicId,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }, // Auto WebP/AVIF
      { width: 1200, crop: 'limit' },             // Max width cap
    ],
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error('[Cloudinary] Upload failed', { error: error.message });
        return reject(new Error(`Image upload failed: ${error.message}`));
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    if (Buffer.isBuffer(source)) {
      uploadStream.end(source);
    } else {
      // File path — use string upload
      cloudinary.uploader.upload(source, uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Image upload failed: ${error.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
    }
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 *
 * @param {string} publicId - Cloudinary public_id
 */
async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Non-fatal: log but don't crash the request
    logger.error('[Cloudinary] Delete failed', { publicId, error: err.message });
  }
}

module.exports = { uploadImage, deleteImage };
