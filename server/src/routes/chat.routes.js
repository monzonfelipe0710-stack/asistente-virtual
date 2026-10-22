import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatController from '../controllers/chat.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { autenticarOpcional } from '../middlewares/auth.middleware.js';
import { uploadImagen } from '../config/multerImagen.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 consultas por minuto por IP
  message: { error: 'Demasiadas consultas. Esperá un momento e intentá de nuevo.' },
});

router.get('/checklist/:tramiteId', asyncHandler(chatController.obtenerChecklist));
router.post(
  '/',
  chatLimiter,
  autenticarOpcional,
  uploadImagen.single('imagen'),
  asyncHandler(chatController.consultar),
);

export default router;