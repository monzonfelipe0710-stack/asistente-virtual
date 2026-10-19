import prisma from '../config/prisma.js';

export const registrarConsulta = async ({ textoConsulta, tramiteId, encontrado, usuarioId }) => {
  return prisma.consulta.create({
    data: {
      textoConsulta,
      tramiteId: tramiteId ?? null,
      encontrado,
      usuarioId: usuarioId ?? null,
    },
  });
};

export const consultasPorTramite = async (sectorIds = null) => {
  return prisma.consulta.groupBy({
    by: ['tramiteId'],
    where: {
      encontrado: true,
      ...(sectorIds ? { tramite: { sectorId: { in: sectorIds } } } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { tramiteId: 'desc' } },
  });
};

export const consultasSinRespuesta = async () => {
  return prisma.consulta.findMany({
    where: { encontrado: false },
    orderBy: { fecha: 'desc' },
    take: 50,
  });
};

export const consultasDeUsuario = async (usuarioId) => {
  return prisma.consulta.findMany({
    where: { usuarioId },
    orderBy: { fecha: 'desc' },
    take: 50,
    select: {
      id: true,
      textoConsulta: true,
      encontrado: true,
      fecha: true,
      tramite: { select: { id: true, nombre: true } },
    },
  });
};