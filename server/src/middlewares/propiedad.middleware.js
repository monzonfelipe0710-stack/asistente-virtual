import prisma from '../config/prisma.js';
import { usuarioTieneSector, listarSectoresDeUsuario } from '../services/usuario.service.js';
import { sectorIdSchema } from '../validators/metrica.validator.js';

const noEncontrado = (mensaje) => {
  const error = new Error(mensaje);
  error.statusCode = 404;
  return error;
};

// 404 y no 403 ante un trámite de otro sector, igual que GET /api/tramites/:id: no revela qué ids existen.
export const puedeGestionarTramite = async (req, res, next) => {
  const id = Number(req.params.id);

  const tramite = await prisma.tramite.findUnique({ where: { id } });
  if (!tramite || !(await usuarioTieneSector(req.usuario.id, tramite.sectorId))) {
    throw noEncontrado('Trámite no encontrado.');
  }

  req.tramite = tramite;
  next();
};

// req.sectorIds: null = todo el sistema (solo el SU sin ?sectorId). Un ADM queda siempre en sus
// sectores; pedir uno ajeno responde 404, como un trámite ajeno.
export const alcanceSectores = async (req, res, next) => {
  const { sectorId } = sectorIdSchema.parse(req.query);

  if (req.usuario.rol === 'SUPERUSUARIO') {
    req.sectorIds = sectorId ? [sectorId] : null;
    return next();
  }

  const propios = (await listarSectoresDeUsuario(req.usuario.id)).map((s) => s.id);
  if (sectorId && !propios.includes(sectorId)) throw noEncontrado('Sector no encontrado.');

  req.sectorIds = sectorId ? [sectorId] : propios;
  next();
};
