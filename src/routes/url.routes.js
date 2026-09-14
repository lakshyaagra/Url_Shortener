import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  updateUrlController,
  deleteUrlController,
  getUrlAnalyticsController,
  redirectUrl
} from '../controllers/url.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateCreateUrl,validateUpdateUrl, validateGetUrls, validateAnalytics } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../utils/async-handler.js'

const router = Router();

router.get('/', authMiddleware, validateGetUrls, asyncHandler(getUrls));
router.post('/', authMiddleware, validateCreateUrl, asyncHandler(createUrlController));
router.patch('/:shortCode', authMiddleware, validateUpdateUrl, asyncHandler(updateUrlController));
router.delete('/:shortCode', authMiddleware, asyncHandler(deleteUrlController));
router.get('/:shortCode/analytics',authMiddleware, validateAnalytics, asyncHandler(getUrlAnalyticsController));

// everyone should be able to use the short URL
router.get('/:shortCode', asyncHandler(redirectUrl));

export default router;