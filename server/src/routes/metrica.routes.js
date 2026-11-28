import { Router } from 'express';
import * as metricaController from '../controllers/metrica.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { alcanceSectores } from '../middlewares/propiedad.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.use(autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(alcanceSectores));

router.get('/por-tramite', asyncHandler(metricaController.porTramite));
router.get('/sin-respuesta', asyncHandler(metricaController.sinRespuesta));
router.get('/calificaciones', asyncHandler(metricaController.calificaciones));
router.get('/resumen', asyncHandler(metricaController.resumen));

export default router;
