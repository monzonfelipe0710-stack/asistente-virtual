import { Router } from 'express';
import * as tramiteController from '../controllers/tramite.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { esPropietarioDelTramite } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.post('/', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(tramiteController.crear));
router.get('/', autenticar, asyncHandler(tramiteController.listar));
router.get('/:id', autenticar, asyncHandler(tramiteController.obtener));
router.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietarioDelTramite), asyncHandler(tramiteController.actualizar));
router.delete('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietarioDelTramite), asyncHandler(tramiteController.eliminar));

export default router;