import prisma from '../config/prisma.js';

export const esPropietario = async (req, res, next) => {
  const id = Number(req.params.id);

  const tramite = await prisma.tramite.findUnique({ where: { id } }); 

  if (!tramite) {
    const error = new Error('Trámite no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (tramite.encargadoId !== req.usuario.id) {
    const error = new Error('No se puede modificar un trámite que no te pertenezca.');
    error.statusCode = 403;
    throw error;
  }

  req.tramite = tramite;
  next();
};