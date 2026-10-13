import redisClient from './config/redis.js';
import app from './app.js';
import { env } from './config/env.js'

// Redis connection and server start
async function startServer() {
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