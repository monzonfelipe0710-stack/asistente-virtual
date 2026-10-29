import { Router } from 'express';
import { autenticar } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as consultaController from '../controllers/consulta.controller.js';

const router = Router();

router.get('/mias', autenticar, asyncHandler(consultaController.misConsultas));
router.patch('/:id/calificar', autenticar, asyncHandler(consultaController.calificarConsulta));
router.patch('/:id/calificar-publica', asyncHandler(consultaController.calificarConsultaPublica));

export default router;