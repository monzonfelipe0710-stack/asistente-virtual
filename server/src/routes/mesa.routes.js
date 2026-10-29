import { Router } from 'express';
import * as mesaController from '../controllers/mesa.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validarId } from '../middlewares/validarId.middleware.js';

const router = Router();

router.param('id', validarId('Mesa no encontrada.'));

// Lectura: personal (el empleado necesita ver las mesas para asociar trámites).
router.get('/', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(mesaController.listar));
router.get('/:id', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(mesaController.obtener));

// Gestión: solo el supervisor.
router.post('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(mesaController.crear));
router.patch('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(mesaController.actualizar));
router.delete('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(mesaController.eliminar));

export default router;
