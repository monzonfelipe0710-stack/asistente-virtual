import { Router } from 'express';
import * as tramiteController from '../controllers/tramite.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { esPropietario } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import documentoRoutes from './documento.routes.js';

const router = Router();

router.post('/', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(tramiteController.crear));
router.get('/', autenticar, asyncHandler(tramiteController.listar));
router.get('/:id', autenticar, asyncHandler(tramiteController.obtener));
router.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietario), asyncHandler(tramiteController.actualizar));
router.delete('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietario), asyncHandler(tramiteController.eliminar));
router.patch('/:id/publicar', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietario), asyncHandler(tramiteController.publicar));
router.patch('/:id/despublicar', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(esPropietario), asyncHandler(tramiteController.despublicar));
router.use('/:id/documentos', documentoRoutes);

export default router;