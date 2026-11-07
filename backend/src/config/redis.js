import { createClient } from 'redis';
import 'dotenv/config';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (error) => {
  console.error('Redis Client Error:', error);
});

export default redisClient;