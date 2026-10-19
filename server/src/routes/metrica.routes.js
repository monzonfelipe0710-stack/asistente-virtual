import { Router } from 'express';
import * as metricaController from '../controllers/metrica.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/roles.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/por-tramite', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(metricaController.porTramite));
router.get('/sin-respuesta', autenticar, autorizar('SUPERUSUARIO', 'ADMINISTRADOR'), asyncHandler(metricaController.sinRespuesta));

export default router;