import { Router } from 'express';
import {
  getUrls,
  createUrlController,
  redirectUrl
} from '../controllers/url.controller.js';

const router = Router();

router.get('/', getUrls);
router.post('/', createUrlController);
router.get('/:shortCode', redirectUrl);

export default router;