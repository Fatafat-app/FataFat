'use strict';

const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const logger = require('../config/logger');

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

async function uploadImage(source, { folder, publicId } = {}) {
  const uploadOptions = {
    folder,
    public_id: publicId,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, crop: 'limit' },
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
      cloudinary.uploader.upload(source, uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Image upload failed: ${error.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
    }
  });
}

async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error('[Cloudinary] Delete failed', { publicId, error: err.message });
  }
}

module.exports = { uploadImage, deleteImage };
