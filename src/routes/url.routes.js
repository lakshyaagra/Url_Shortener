import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  updateUrlController,
  deleteUrlController,
  redirectUrl
} from '../controllers/url.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, getUrls);
router.post('/', authMiddleware, createUrlController);
router.patch('/:shortCode', authMiddleware, updateUrlController);
router.delete('/:shortCode', authMiddleware, deleteUrlController);


// everyone should be able to use the short URL
router.get('/:shortCode', redirectUrl);

export default router;