import { Router } from 'express';
import * as documentoController from '../controllers/documento.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { puedeGestionarTramite } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { upload } from '../config/multer.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  autenticar,
  autorizar('ADMINISTRADOR'),
  asyncHandler(puedeGestionarTramite),
  upload.single('archivo'),
  asyncHandler(documentoController.subir)
);

router.get('/', autenticar, asyncHandler(documentoController.listar));

router.get('/:docId/descargar', autenticar, asyncHandler(documentoController.descargar));

router.delete(
  '/:docId',
  autenticar,
  autorizar('ADMINISTRADOR'),
  asyncHandler(puedeGestionarTramite),
  asyncHandler(documentoController.eliminar)
);

export default router;