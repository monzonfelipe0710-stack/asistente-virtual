import prisma from '../config/prisma.js';

export const registrarConsulta = async ({ textoConsulta, respuesta, tramiteId, encontrado, usuarioId, topico }) => {
  return prisma.consulta.create({
    data: {
      textoConsulta,
      respuesta: respuesta ?? null,
      tramiteId: tramiteId ?? null,
      encontrado,
      usuarioId: usuarioId ?? null,
      topico: topico ?? null,
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
    take: 100,
    select: {
      id: true,
      textoConsulta: true,
      respuesta: true,
      encontrado: true,
      calificacion: true,
      topico: true,
      fecha: true,
      tramite: { select: { id: true, nombre: true } },
    },
  });
};

export const calificarConsulta = async (consultaId, usuarioId, calificacion) => {
  const existe = await prisma.consulta.findFirst({
    where: { id: consultaId, usuarioId },
  });
  if (!existe) return null;
  return prisma.consulta.update({
    where: { id: consultaId },
    data: { calificacion },
    select: { id: true, calificacion: true },
  });
};

export const eliminarConsulta = async (consultaId, usuarioId) => {
  const resultado = await prisma.consulta.deleteMany({
    where: { id: consultaId, usuarioId },
  });
  return resultado.count > 0;
};

export const resumenActividad = async (usuarioId) => {
  const ahora = new Date();
  const desde = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  const [total, conRespuesta, positivas, negativas, tramites, topicos, ultimoMes] =
    await Promise.all([
      prisma.consulta.count({ where: { usuarioId } }),
      prisma.consulta.count({ where: { usuarioId, encontrado: true } }),
      prisma.consulta.count({ where: { usuarioId, calificacion: 1 } }),
      prisma.consulta.count({ where: { usuarioId, calificacion: 0 } }),
      prisma.consulta.groupBy({
        by: ['tramiteId'],
        where: { usuarioId, tramiteId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { tramiteId: 'desc' } },
        take: 5,
      }),
      prisma.consulta.groupBy({
        by: ['topico'],
        where: { usuarioId, topico: { not: null }, fecha: { gte: desde } },
        _count: { _all: true },
        orderBy: { _count: { topico: 'desc' } },
      }),
      prisma.consulta.count({
        where: {
          usuarioId,
          fecha: { gte: desde },
        },
      }),
    ]);

  let tramitesTop = [];
  if (tramites.length > 0) {
    const ids = tramites.map((t) => t.tramiteId);
    const rows = await prisma.tramite.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });
    const porId = new Map(rows.map((t) => [t.id, t.nombre]));
    tramitesTop = tramites.map((t) => ({
      tramiteId: t.tramiteId,
      nombre: porId.get(t.tramiteId) ?? 'Trámite',
      cantidad: t._count._all,
    }));
  }

  return {
    total,
    conRespuesta,
    sinRespuesta: total - conRespuesta,
    positivas,
    negativas,
    ultimoMes,
    tramitesTop,
    topicos: topicos
      .filter((t) => t.topico)
      .map((t) => ({ topico: t.topico, cantidad: t._count._all })),
  };
};