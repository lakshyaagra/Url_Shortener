import redisClient from '../config/redis.js';

// 10 minutes
const CACHE_TTL_SECONDS = 600;

function getCacheKey(shortCode) {
  return `url:${shortCode}`;
}

export async function getCachedUrl(shortCode) {
// If Redis isn't available, we pretend this is a cache miss.
  if (!redisClient.isReady) {
    return null;
  }

  const key = getCacheKey(shortCode);
  const cachedUrl = await redisClient.get(key);

  if (!cachedUrl) {
    return null;
  }
  return JSON.parse(cachedUrl);
}

export async function cacheUrl(url) {
  if (!redisClient.isReady) {
    return;
  }

  const key = getCacheKey(url.shortCode);
  const cacheValue = {
    id: url.id,
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    expiresAt: url.expiresAt
      ? url.expiresAt.toString()
      : null,
    isActive: url.isActive,
  };

  await redisClient.set(
    key,
    JSON.stringify(cacheValue),
    {
      EX: CACHE_TTL_SECONDS,
    }
  );
}