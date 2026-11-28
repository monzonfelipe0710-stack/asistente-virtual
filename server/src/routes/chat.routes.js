import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { autenticarOpcional } from '../middlewares/auth.middleware.js';
import { crearLimitadoresChat } from '../config/rateLimit.js';
import { LIMITES_CHAT } from '../config/chat.js';

const router = Router();

const limitesChat = crearLimitadoresChat(LIMITES_CHAT);

router.post('/', ...limitesChat, autenticarOpcional, asyncHandler(chatController.consultar));
router.post('/stream', ...limitesChat, autenticarOpcional, asyncHandler(chatController.consultarStream));

export default router;
