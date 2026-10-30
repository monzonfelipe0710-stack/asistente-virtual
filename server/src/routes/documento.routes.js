import { Router } from 'express';
import * as documentoController from '../controllers/documento.controller.js';
import { autenticar, autenticarOpcional } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { puedeGestionarTramite } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validarId } from '../middlewares/validarId.middleware.js';
import { upload } from '../config/multer.js';
import { publicoLimiter } from '../config/rateLimit.js';

// El :id del trámite lo valida el router.param de tramite.routes.js antes de llegar acá.
const router = Router({ mergeParams: true });

router.param('docId', validarId('Documento no encontrado.'));

router.post(
  '/',
  autenticar,
  autorizar('ADMINISTRADOR'),
  asyncHandler(puedeGestionarTramite),
  upload.single('archivo'),
  asyncHandler(documentoController.subir)
);

// Públicas para trámites publicados; el controller limita los borradores.
router.get('/', publicoLimiter, autenticarOpcional, asyncHandler(documentoController.listar));

router.get('/:docId/descargar', publicoLimiter, autenticarOpcional, asyncHandler(documentoController.descargar));

router.delete(
  '/:docId',
  autenticar,
  autorizar('ADMINISTRADOR'),
  asyncHandler(puedeGestionarTramite),
  asyncHandler(documentoController.eliminar)
);

export default router;