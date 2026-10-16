import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { loginLimiter } from '../config/rateLimit.js';

const router = Router();

router.post('/login', loginLimiter, asyncHandler(login));

export default router;