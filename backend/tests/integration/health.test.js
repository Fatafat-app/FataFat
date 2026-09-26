'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('API Health and Core Route Integrations', () => {
  test('GET /api/v1/health returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /unknown-route returns 404', async () => {
    const res = await request(app).get('/api/v1/random-route-xyz');
    expect(res.status).toBe(404);
  });
});
