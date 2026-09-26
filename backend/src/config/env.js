'use strict';

require('dotenv').config();

/**
 * env.js — Centralised environment variable validation.
 *
 * Reads process.env, validates required vars, and exports a typed
 * config object. The app WILL NOT START if a required variable is missing.
 * No other file should read process.env directly — import this module instead.
 */

const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'ALLOWED_ORIGINS',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'GOOGLE_MAPS_API_KEY',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[Config] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
        'Check .env.example for the full list of required variables.'
    );
  }
}

// Load .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  // dotenv is loaded in server.js before this module is imported
}

validateEnv();

const env = {
  node: {
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },
  db: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '300', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },
};

module.exports = env;
