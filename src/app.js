import 'dotenv/config';
import 'temporal-polyfill/global';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors'; 
import { env } from './config/env.js'

import { generalRateLimiter } from './middleware/rateLimitMiddleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js';

import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';

import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust 1 hop (Render, Heroku, Railway, NGINX)
}

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(generalRateLimiter)

app.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'URL Shortener API is running',
    commit: process.env.GIT_SHA || 'unknown',
  });
});

app.use('/api/v1/urls', urlRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;