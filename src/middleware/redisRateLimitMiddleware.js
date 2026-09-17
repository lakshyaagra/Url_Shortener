import { checkRateLimit } from '../services/redis-rate-limit.service.js';

export async function redisRateLimitMiddleware(req, res, next) {
  const identifier = req.ip;

  const result = await checkRateLimit(identifier);

  res.setHeader(
    'X-RateLimit-Remaining',
    result.remaining
  );

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  }

  next();
}