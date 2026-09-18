import redisClient from './config/redis.js';
import app from './app.js';

const PORT = process.env.PORT || 3000;

// Redis connection and server start
async function startServer() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    console.log('Redis connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Redis connection failed:', error);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Starting without Redis cache');
    });
  }
}

startServer();