import { Router } from 'express';
import * as sectorController from '../controllers/sector.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.post('/', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.crear));
router.get('/', autenticar, asyncHandler(sectorController.listar));
router.get('/:id', autenticar, asyncHandler(sectorController.obtener));
router.put('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.actualizar));
router.delete('/:id', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(sectorController.eliminar));

export default router;