import 'dotenv/config';
import 'temporal-polyfill/global';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { generalRateLimiter } from './middleware/rateLimitMiddleware.js';

import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';

import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});