import { Router } from 'express';
import * as documentoController from '../controllers/documento.controller.js';
import { autenticar, autenticarOpcional } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { puedeGestionarTramite } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { upload } from '../config/multer.js';
import { publicoLimiter } from '../config/rateLimit.js';

const router = Router({ mergeParams: true });

const ID_MAXIMO = 2147483647; // tope de Int en Postgres

const esIdValido = (valor) => /^[1-9]\d*$/.test(valor) && Number(valor) <= ID_MAXIMO;

const idInvalido = (mensaje) => {
  const error = new Error(mensaje);
  error.statusCode = 404;
  return error;
};

// Ids que no son enteros positivos responden 404 antes de que un NaN llegue a Prisma.
router.use((req, res, next) => {
  if (!esIdValido(req.params.id)) return next(idInvalido('Trámite no encontrado.'));
  next();
});

router.param('docId', (req, res, next, valor) => {
  if (!esIdValido(valor)) return next(idInvalido('Documento no encontrado.'));
  next();
});

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