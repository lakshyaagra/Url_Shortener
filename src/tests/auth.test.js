import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';

// Understand from last test


// request(app)
// means:
// "I want to make an HTTP request against my Express application."

// Test 1 — Registration succeeds
test('POST /api/v1/auth/register should create a user', async () => {
  const email = `test-${Date.now()}@example.com`;

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test User',
      email,
      password: 'TestPassword123',
    });

  assert.equal(response.statusCode, 201);
});

// Test 2 — Invalid email test
test('register should reject invalid email', async () => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'TestPassword123',
    });

  assert.equal(response.statusCode, 400);
});

// Test 3 — Duplicate email test
test('register should reject duplicate email', async () => {
  const email = `duplicate-${Date.now()}@example.com`;

  const user = {
    name: 'Test User',
    email,
    password: 'TestPassword123',
  };

  const firstResponse = await request(app)
    .post('/api/v1/auth/register')
    .send(user);

  assert.equal(firstResponse.statusCode, 201);

  const secondResponse = await request(app)
    .post('/api/v1/auth/register')
    .send(user);

  assert.equal(secondResponse.statusCode, 409);
});

// Test 4 — Login success test
test('POST /api/v1/auth/login should authenticate a user', async () => {
  const email = `login-${Date.now()}@example.com`;
  const password = 'TestPassword123';
// why are we registering before testing login?
// Because login requires a user to already exist.
// Think about Postman.
// You can't test:
// POST /login
// with a completely nonexistent user and expect success.
// This is called :- Setting up data
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Login User',
      email,
      password,
    });
// we don't care about its response for this particular test. islie save nhi kia
// We only care that the user exists so we can perform the next step.
    
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email,
      password,
    });

  assert.equal(response.statusCode, 200);
});

// Test 5 — Invalid Login
// Create a test called "login should reject invalid credentials."
test('login should reject invalid credentials', async () => {
// Send a request to my Express application and wait for the response.
  const response = await request(app)
    .post('/api/v1/auth/login')   // Make it a POST request to /api/v1/auth/login.

    // Send this JSON as the request body.
    .send({
      email: 'does-not-exist@example.com',
      password: 'WrongPassword123',
    });
//   I expect the server to return HTTP 401.
  assert.equal(response.statusCode, 401);
});