import { Router } from 'express';
import * as documentoController from '../controllers/documento.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validarId } from '../middlewares/validarId.middleware.js';
import { publicoLimiter } from '../config/rateLimit.js';

const router = Router();

router.use(publicoLimiter);
router.param('id', validarId('Documento no encontrado.'));

router.get('/:id/descargar', asyncHandler(documentoController.descargarPublico));

export default router;
