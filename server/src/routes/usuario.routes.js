import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

// Pública: registro de solicitud
router.post('/registro', asyncHandler(usuarioController.registrar));

// Solo superusuario: gestión de solicitudes  
router.get('/pendientes', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.listarPendientes));
router.patch('/:id/aprobar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.aprobar));
router.patch('/:id/rechazar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.rechazar));

export default router;