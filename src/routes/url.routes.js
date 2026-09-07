import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  redirectUrl
} from '../controllers/url.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, getUrls);
router.post('/', authMiddleware, createUrlController);
router.get('/:shortCode', redirectUrl);

export default router;