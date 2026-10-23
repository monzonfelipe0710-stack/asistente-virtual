import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { registroLimiter } from '../config/rateLimit.js';

const router = Router();

// Pública: registro de solicitud
router.post('/registro-ciudadano', registroLimiter, asyncHandler(usuarioController.registrarCiudadano));

// Solo superusuario: gestión de solicitudes  
router.get('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.listar));
router.get('/me/sectores', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(usuarioController.misSectores));
router.get('/:id/sectores', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.listarSectores));
router.put('/:id/sectores', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.asignarSectores));

// Solo superusuario: baja y reingreso de cuentas ya aprobadas
router.patch('/:id/suspender', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.suspender));
router.patch('/:id/reactivar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.reactivar));
router.post('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(usuarioController.crearEmpleado));

export default router;