import request from 'supertest';

export async function createTestUser(app) {
  // We're making the email extremely unlikely to collide.
  const email = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'TestPassword123!';

  await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test User',
      email,
      password,
    });

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email,
      password,
    });

  return {
    email,
    password,
    token: loginResponse.body.data?.token || loginResponse.body.token,
  };
}