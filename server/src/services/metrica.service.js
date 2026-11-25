import crypto from 'node:crypto';
import prisma from '../config/prisma.js';
import { ACLARACION, RESPUESTA, SOLO_RESPUESTAS } from './tipo-consulta.js';
import { filtroFecha } from './consulta.service.js';

const deSectores = (sectorIds) => (sectorIds ? { tramite: { sectorId: { in: sectorIds } } } : {});

// Una aclaración se guarda sin token: no se puede calificar.
export const registrarConsulta = async ({ textoConsulta, tramiteId, encontrado, usuarioId, respuesta, modelo, tipo = RESPUESTA }) => {
  return prisma.consulta.create({
    data: {
      tipo,
      textoConsulta,
      tramiteId: tramiteId ?? null,
      encontrado,
      usuarioId: usuarioId ?? null,
      respuesta: respuesta ?? null,
      modelo: modelo ?? null,
      calificarToken: tipo === ACLARACION ? null : crypto.randomBytes(16).toString('hex'),
    },
    select: { id: true, calificarToken: true },
  });
};

export const consultasPorTramite = async (sectorIds = null, { desde, hasta, tramiteId } = {}) => {
  const grupos = await prisma.consulta.groupBy({
    by: ['tramiteId'],
    where: {
      ...SOLO_RESPUESTAS,
      encontrado: true,
      tramiteId: tramiteId ?? { not: null },
      fecha: filtroFecha(desde, hasta),
      ...deSectores(sectorIds),
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

// El chat no guarda trámite en las que no encontró: con un alcance de sectores no queda ninguna.
export const consultasSinRespuesta = async (sectorIds = null, { desde, hasta } = {}) => {
  return prisma.consulta.findMany({
    where: { ...SOLO_RESPUESTAS, encontrado: false, fecha: filtroFecha(desde, hasta), ...deSectores(sectorIds) },
    orderBy: { fecha: 'desc' },
    take: 50,
    // Sin usuarioId: quién preguntó no le corresponde a quien mira las métricas.
    select: { id: true, textoConsulta: true, encontrado: true, fecha: true, tramiteId: true },
  });
};

// Respuestas y aclaraciones por separado. Las aclaraciones y las sin respuesta no tienen trámite:
// con un alcance de sectores no se pueden atribuir y van null.
export const resumenConsultas = async (sectorIds = null, { desde, hasta } = {}) => {
  const fecha = filtroFecha(desde, hasta);
  const contar = (where) => prisma.consulta.count({ where: { fecha, ...where } });

  if (sectorIds) {
    const encontradas = await contar({ ...SOLO_RESPUESTAS, encontrado: true, ...deSectores(sectorIds) });
    return { respuestas: { total: encontradas, encontradas, sinRespuesta: null }, aclaraciones: null };
  }

  const [total, encontradas, aclaraciones] = await Promise.all([
    contar(SOLO_RESPUESTAS),
    contar({ ...SOLO_RESPUESTAS, encontrado: true }),
    contar({ tipo: ACLARACION }),
  ]);
  return { respuestas: { total, encontradas, sinRespuesta: total - encontradas }, aclaraciones };
};

export const consultasDeUsuario = async (usuarioId) => {
  return prisma.consulta.findMany({
    where: { ...SOLO_RESPUESTAS, usuarioId },
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