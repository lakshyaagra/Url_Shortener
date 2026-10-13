import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../app.js';
import { db } from '../prisma/db.ts';  // This gives our test direct access to the database.
import { createTestUser } from './helpers.js';
import { deleteUserByEmail } from './database.js';  // To delete test user at end.

test('creating a URL should persist it in PostgreSQL', async () => {
  // Arrange
  const { token, email } = await createTestUser(app);

  try {
    // Act
    const response = await request(app)
      .post('/api/v1/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalUrl: 'https://example.com',
      });
    // Assert API response
    assert.equal(response.statusCode, 201);

    // Get the generated short code
    const shortCode =
      response.body.data?.shortCode ||
      response.body.shortCode;

    // The API should have returned a short code.
    assert.ok(shortCode);

    // Assert Database
    const savedUrl = await db.orm.public.Urls
      .where({
        shortCode,
      })
      .select(
        'id',
        'userId',
        'shortCode',
        'originalUrl',
        'isActive'
      )
      // We're querying PostgreSQL directly through Prisma 8 ORM layer.
      // We're asking:
      // "Does the URL we just created actually exist in the database?"
      .first();

    assert.ok(savedUrl);

    assert.equal(savedUrl.shortCode, shortCode); // We're checking that the stored short code matches what the API returned.
    assert.equal(savedUrl.originalUrl, 'https://example.com/');  // ...
    assert.equal(savedUrl.isActive, true);  // ...
  } finally {
    await deleteUserByEmail(email);
  }
});