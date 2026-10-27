import { Router } from 'express';
import * as tramiteController from '../controllers/tramite.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { puedeGestionarTramite } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import documentoRoutes from './documento.routes.js';

const router = Router();

router.post('/', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(tramiteController.crear));
router.get('/', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(tramiteController.listar));
router.get('/:id', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(tramiteController.obtener));
router.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(puedeGestionarTramite), asyncHandler(tramiteController.actualizar));
router.delete('/:id', autenticar, autorizar('ADMINISTRADOR'), asyncHandler(puedeGestionarTramite), asyncHandler(tramiteController.eliminar));
router.patch('/:id/publicar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(tramiteController.publicar));
router.patch('/:id/despublicar', autenticar, autorizar('SUPERUSUARIO'), asyncHandler(tramiteController.despublicar));
router.use('/:id/documentos', documentoRoutes);

export default router;