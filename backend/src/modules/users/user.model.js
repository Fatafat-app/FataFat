'use strict';

/**
 * user.model.js — Mongoose schema for all users.
 *
 * All roles (customer, restaurant_owner, delivery_partner, admin) share this model.
 * Sensitive fields (passwordHash, refreshTokenHash, fcmToken) use select: false.
 */

const mongoose = require('mongoose');
const ROLES = require('../../common/constants/roles');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' }, // e.g. Home, Work, Other
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values (email is optional)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    // Sensitive: never returned in queries unless explicitly selected
    passwordHash: { type: String, select: false },
    refreshTokenHash: { type: String, select: false },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    avatar: { type: String }, // Cloudinary URL
    fcmToken: { type: String, select: false }, // FCM device token

    addresses: [addressSchema],

    // Restaurant owner / delivery partner link
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for geospatial queries on default address
userSchema.index({ 'addresses.location': '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
