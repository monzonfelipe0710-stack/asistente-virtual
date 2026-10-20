import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { loginLimiter } from '../config/rateLimit.js';
import { login, solicitarRecuperacion, restablecer } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.post('/recuperar', loginLimiter, asyncHandler(solicitarRecuperacion));
router.post('/restablecer', loginLimiter, asyncHandler(restablecer));

export default router;