import 'dotenv/config';
import express from 'express';
import urlRoutes from './routes/url.routes.js';
import 'temporal-polyfill/global';

const app = express();

app.use(express.json());

app.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'URL Shortener API is running',
  });
});

app.use('/api/v1/urls', urlRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});