import redisClient from '../config/redis.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 60;

export async function checkRateLimit(identifier) {
  if (!redisClient.isReady) {
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
    };
  }

  const key = `rate-limit:${identifier}`;

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }

  const remaining = Math.max(MAX_REQUESTS - count, 0);

  return {
    allowed: count <= MAX_REQUESTS,
    remaining,
  };
}