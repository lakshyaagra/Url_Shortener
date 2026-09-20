import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';

test('GET /health should return 200', async () => {
  const response = await request(app)
    .get('/health');

  assert.equal(response.statusCode, 200);
});