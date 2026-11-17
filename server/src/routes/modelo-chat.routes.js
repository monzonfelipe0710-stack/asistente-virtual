import { Router } from 'express';
import * as modeloChatController from '../controllers/modelo-chat.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { modelosChatLimiter } from '../config/rateLimit.js';

const router = Router();

router.use(modelosChatLimiter, autenticar, autorizar('SUPERUSUARIO'));

router.get('/', asyncHandler(modeloChatController.listar));
router.put('/activo', asyncHandler(modeloChatController.cambiarActivo));
router.get('/auditoria', asyncHandler(modeloChatController.auditoria));

export default router;
