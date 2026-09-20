import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';
import { createTestUser } from './helpers.js';

// URL creation test
test('POST /api/v1/urls should create a URL', async () => {
  // Arrange
  const { token } = await createTestUser(app);  

  // Act
  const response = await request(app)
    .post('/api/v1/urls')  //This endpoint requires Authentication ,so we set token in it
    .set('Authorization', `Bearer ${token}`)
    .send({
      originalUrl: 'https://example.com',
    });

  // Assert
  assert.equal(response.statusCode, 201);
});


// Again:
// Create authenticated user
//         ↓
// Send invalid URL
//         ↓
// Backend validation
//         ↓
// 400 expected   for
// Invalid URL test
test('POST /api/v1/urls should reject invalid URL', async () => {
  const { token } = await createTestUser(app);

  const response = await request(app)
    .post('/api/v1/urls')
    .set('Authorization', `Bearer ${token}`)
    .send({
      originalUrl: 'not-a-url',
    });

  assert.equal(response.statusCode, 400);
});

// Unauthenticated request test
test('GET /api/v1/urls should reject unauthenticated requests', async () => {
  const response = await request(app)
    .get('/api/v1/urls');

  assert.equal(response.statusCode, 401);
});

// Get user's URLs test
test('GET /api/v1/urls should return user URLs', async () => {
  const { token } = await createTestUser(app);

  const response = await request(app)
    .get('/api/v1/urls')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.statusCode, 200);
  
  // Unwrap urls from response.body.data
  const urls = response.body.data;
  // I expect urls to be an array.
  assert.ok(Array.isArray(urls));
});

// REDIRECT test
test('GET /api/v1/urls/:shortCode should redirect', async () => {
  const { token } = await createTestUser(app);

  // Create a short URL
  const createResponse = await request(app)
    .post('/api/v1/urls')
    .set('Authorization', `Bearer ${token}`)
    .send({
      originalUrl: 'https://example.com',
    });

  assert.equal(createResponse.statusCode, 201);

  // Unwrap shortCode from body.data or fallback to body.shortCode
  const shortCode = createResponse.body.data?.shortCode || createResponse.body.shortCode;
  
  const redirectResponse = await request(app)
    .get(`/api/v1/urls/${shortCode}`)
    .redirects(0);
    // Normally, Supertest can follow redirects.
    // But we don't want that.

  assert.equal(redirectResponse.statusCode, 302);
});

// Unknown short code test
test('GET unknown short code should return 404', async () => {
  const response = await request(app)
    .get('/api/v1/urls/doesNotExist');

  assert.equal(response.statusCode, 404);
});

// Rate limit test
test('rate limiter should return 429 after limit', async () => {
  let lastResponse;

  // Fire 101 requests to exceed the 100-request limit
  for (let i = 0; i < 101; i++) {
    lastResponse = await request(app).get('/api/v1/urls/KKoXb9');
  }

  assert.equal(lastResponse.statusCode, 429);
});