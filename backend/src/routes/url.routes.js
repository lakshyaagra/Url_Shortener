import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  updateUrlController,
  deleteUrlController,
  getUrlAnalyticsController,
  redirectUrl
} from '../controllers/url.controller.js';
import { createPublicUrlController } from '../controllers/public-url.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateCreateUrl,validateUpdateUrl, validateGetUrls, validateAnalytics } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../utils/async-handler.js'
import { redisRateLimitMiddleware } from '../middleware/redisRateLimitMiddleware.js';
import { publicCreateRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.get('/', authMiddleware, validateGetUrls, asyncHandler(getUrls));
router.post('/', authMiddleware, validateCreateUrl, asyncHandler(createUrlController));

// no login required: visitors can create (but never edit) a short link
router.post('/public', publicCreateRateLimiter, validateCreateUrl, asyncHandler(createPublicUrlController));

router.patch('/:shortCode', authMiddleware, validateUpdateUrl, asyncHandler(updateUrlController));
router.delete('/:shortCode', authMiddleware, asyncHandler(deleteUrlController));
router.get('/:shortCode/analytics',authMiddleware, validateAnalytics, asyncHandler(getUrlAnalyticsController));

// everyone should be able to use the short URL
router.get('/:shortCode',redisRateLimitMiddleware, asyncHandler(redirectUrl));

export default router;