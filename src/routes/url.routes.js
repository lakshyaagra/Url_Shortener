import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  updateUrlController,
  deleteUrlController,
  redirectUrl
} from '../controllers/url.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateCreateUrl,validateUpdateUrl, validateGetUrls } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../utils/async-handler.js'

const router = Router();

router.get('/', authMiddleware, validateGetUrls, asyncHandler(getUrls));
router.post('/', authMiddleware, validateCreateUrl, asyncHandler(createUrlController));
router.patch('/:shortCode', authMiddleware, validateUpdateUrl, asyncHandler(updateUrlController));
router.delete('/:shortCode', authMiddleware, asyncHandler(deleteUrlController));


// everyone should be able to use the short URL
router.get('/:shortCode', asyncHandler(redirectUrl));

export default router;