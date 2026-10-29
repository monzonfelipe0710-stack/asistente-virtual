import { Router } from 'express';
import * as sectorController from '../controllers/sector.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validarId } from '../middlewares/validarId.middleware.js';

const router = Router();

router.param('id', validarId('Sector no encontrado.'));

router.post('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.crear));
router.get('/', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(sectorController.listar));
router.get('/:id', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(sectorController.obtener));
router.patch('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.actualizar));
router.delete('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.eliminar));

export default router;