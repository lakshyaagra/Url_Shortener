import { Router } from 'express';
import { registerController,loginController } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';
import { asyncHandler } from '../utils/async-handler.js'

const router = Router();

router.post('/register', validateRegister, asyncHandler(registerController));
router.post('/login', validateLogin, asyncHandler(loginController));

export default router;