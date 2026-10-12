'use strict';

const mongoose = require('mongoose');

/**
 * Factory for creating standardized Master Data schemas
 * @param {Object} extraFields - Domain-specific fields for the master entity
 * @param {Object} options - Schema options
 */
function createMasterSchema(extraFields = {}, options = {}) {
  const schemaDefinition = {
    code: {
      type: String,
      required: [true, 'Master code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_]{2,50}$/, 'Code must be 2-50 uppercase alphanumeric characters or underscores'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    iconUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...extraFields,
  };

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    ...options,
  });

  schema.index({ isActive: 1, sortOrder: 1, name: 1 });

  return schema;
}

module.exports = {
  createMasterSchema,
};
