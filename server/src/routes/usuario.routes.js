import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.post('/registro', asyncHandler(usuarioController.registrar));

export default router;