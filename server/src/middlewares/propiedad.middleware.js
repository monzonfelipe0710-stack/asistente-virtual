import prisma from '../config/prisma.js';
import { usuarioTieneSector } from '../services/usuario.service.js';

export const puedeGestionarTramite = async (req, res, next) => {
  const id = Number(req.params.id);

  const tramite = await prisma.tramite.findUnique({ where: { id } });
  if (!tramite) {
    const error = new Error('Trámite no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const tieneAcceso = await usuarioTieneSector(req.usuario, tramite.sectorId);
  if (!tieneAcceso) {
    const error = new Error('No tenés asignado el sector de este trámite.');
    error.statusCode = 403;
    throw error;
  }

  req.tramite = tramite;
  next();
};