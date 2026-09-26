'use strict';

/**
 * maps.client.js — Google Maps API wrapper.
 *
 * Provides geocoding and distance matrix operations.
 * All external map requests go through this module.
 */

const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Geocode an address string to coordinates.
 *
 * @param {string} address - Human-readable address
 * @returns {Promise<{ lat: number, lng: number, formattedAddress: string }>}
 */
async function geocodeAddress(address) {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/geocode/json`, {
      params: { address, key: env.maps.apiKey },
    });

    const { results, status } = response.data;

    if (status !== 'OK' || !results.length) {
      throw new Error(`Geocoding failed: ${status}`);
    }

    const { lat, lng } = results[0].geometry.location;
    return {
      lat,
      lng,
      formattedAddress: results[0].formatted_address,
    };
  } catch (err) {
    logger.error('[Maps] Geocode failed', { address, error: err.message });
    throw err;
  }
}

/**
 * Calculate distance and duration between origin and destination.
 *
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<{ distanceMeters: number, durationSeconds: number }>}
 */
async function getDistance(origin, destination) {
  try {
    const response = await axios.get(`${MAPS_BASE_URL}/distancematrix/json`, {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: env.maps.apiKey,
        mode: 'driving',
        units: 'metric',
      },
    });

    const element = response.data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== 'OK') {
      throw new Error('Distance Matrix returned no results');
    }

    return {
      distanceMeters: element.distance.value,
      durationSeconds: element.duration.value,
    };
  } catch (err) {
    logger.error('[Maps] Distance matrix failed', { error: err.message });
    throw err;
  }
}

module.exports = { geocodeAddress, getDistance };
