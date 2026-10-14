import redisClient from './config/redis.js';
import app from './app.js';
import { env } from './config/env.js'
import { getAnonymousUserId } from './services/anonymous-user.service.js';

// Redis connection and server start
async function startServer() {

  // Create the reserved anonymous account before the first request (and before anyone
  // could register its address). If the database is not ready it is created on first use.
  await getAnonymousUserId().catch((error) => {
    console.error('Could not prepare the anonymous account yet:', error.message);
  });
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('Redis connected');

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Redis connection failed:', error);

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log('Starting without Redis cache');
    });
  }
}

startServer();