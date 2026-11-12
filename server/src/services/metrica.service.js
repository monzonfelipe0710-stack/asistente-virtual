import crypto from 'node:crypto';
import prisma from '../config/prisma.js';

export const registrarConsulta = async ({ textoConsulta, tramiteId, encontrado, usuarioId, respuesta }) => {
  return prisma.consulta.create({
    data: {
      textoConsulta,
      tramiteId: tramiteId ?? null,
      encontrado,
      usuarioId: usuarioId ?? null,
      respuesta: respuesta ?? null,
      calificarToken: crypto.randomBytes(16).toString('hex'),
    },
    select: { id: true, calificarToken: true },
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
    // Sin usuarioId: quién preguntó no le corresponde a quien mira las métricas.
    select: { id: true, textoConsulta: true, encontrado: true, fecha: true, tramiteId: true },
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
      respuesta: true,
      calificacion: true,
      motivoCalificacion: true,
      tramite: { select: { id: true, nombre: true } },
    },
  });
};