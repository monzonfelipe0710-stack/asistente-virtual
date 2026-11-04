import { Router } from 'express';
import { autenticar, autenticarOpcional } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validarId } from '../middlewares/validarId.middleware.js';
import { publicoLimiter } from '../config/rateLimit.js';
import * as consultaController from '../controllers/consulta.controller.js';

const router = Router();

router.param('id', validarId('Consulta no encontrada.'));

router.get('/mias', autenticar, asyncHandler(consultaController.misConsultas));

// Califica el dueño logueado o quien tenga el token que devolvió el chat (anónimos).
router.patch('/:id/calificar', publicoLimiter, autenticarOpcional, asyncHandler(consultaController.calificar));

// Solo el dueño. No borra la fila: la saca de su historial y las métricas no cambian.
router.delete('/:id', autenticar, asyncHandler(consultaController.quitarDelHistorial));

export default router;
