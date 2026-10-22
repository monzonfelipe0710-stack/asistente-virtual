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
  const grupos = await prisma.consulta.groupBy({
    by: ['tramiteId'],
    where: {
      encontrado: true,
      tramiteId: { not: null },
      ...(sectorIds ? { tramite: { sectorId: { in: sectorIds } } } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { tramiteId: 'desc' } },
  });

  if (grupos.length === 0) return [];

  const ids = grupos.map((g) => g.tramiteId);
  const tramites = await prisma.tramite.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, sector: { select: { id: true, nombre: true } } },
  });
  const porId = new Map(tramites.map((t) => [t.id, t]));

  return grupos.map((g) => ({
    tramiteId: g.tramiteId,
    nombre: porId.get(g.tramiteId)?.nombre ?? null,
    sector: porId.get(g.tramiteId)?.sector ?? null,
    cantidad: g._count._all,
  }));
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

export const contarConsultasDeUsuario = async (usuarioId) => {
  const count = await prisma.consulta.count({
    where: { usuarioId },
  });
  return count;
};