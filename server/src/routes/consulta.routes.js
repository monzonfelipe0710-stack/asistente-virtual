import { Router } from 'express';
import { autenticar } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as consultaController from '../controllers/consulta.controller.js';

const router = Router();

router.get('/mias', autenticar, asyncHandler(consultaController.misConsultas));
router.get('/resumen', autenticar, asyncHandler(consultaController.resumenConsultas));
router.delete('/:id', autenticar, asyncHandler(consultaController.eliminarConsulta));

export default router;