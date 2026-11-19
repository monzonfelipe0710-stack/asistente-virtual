import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { loginLimiter, recuperarLimiter, restablecerLimiter } from '../config/rateLimit.js';
import { login, solicitarRecuperacion, restablecer, cambiarPassword } from '../controllers/auth.controller.js';
import { autenticarCambioPassword } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.post('/recuperar', recuperarLimiter, asyncHandler(solicitarRecuperacion));
router.post('/restablecer', restablecerLimiter, asyncHandler(restablecer));
router.post('/cambiar-password', autenticarCambioPassword, asyncHandler(cambiarPassword));

export default router;