import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { registroLimiter } from '../config/rateLimit.js';

const router = Router();

// Pública: registro de solicitud
router.post('/registro', registroLimiter, asyncHandler(usuarioController.registrar));

// Solo superusuario: gestión de solicitudes  
router.get('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.listar));
router.get('/pendientes', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.listarPendientes));
router.patch('/:id/aprobar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.aprobar));
router.patch('/:id/rechazar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.rechazar));

// Solo superusuario: baja y reingreso de cuentas ya aprobadas
router.patch('/:id/suspender', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.suspender));
router.patch('/:id/reactivar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.reactivar));

export default router;