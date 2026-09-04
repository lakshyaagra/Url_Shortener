import { Router } from 'express';
import {
  getUrls,
  createUrlController,
} from '../controllers/url.controller.js';

const router = Router();

router.get('/', getUrls);
router.post('/', createUrlController);

export default router;