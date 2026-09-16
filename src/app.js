import 'dotenv/config';
import 'temporal-polyfill/global';
import redisClient from './config/redis.js';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { generalRateLimiter } from './middleware/rateLimitMiddleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js';

import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';

import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(generalRateLimiter)

app.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'URL Shortener API is running',
  });
});

app.use('/api/v1/urls', urlRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

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