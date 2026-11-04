import crypto from 'node:crypto';
import prisma from '../config/prisma.js';
import { MOTIVOS_PREDEFINIDOS, OTRO_MOTIVO } from '../validators/consulta.validator.js';

const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest();

// Se comparan los hashes para que el tiempo no dependa del largo ni del contenido.
export const tokenCoincide = (recibido, guardado) =>
  typeof recibido === 'string' && typeof guardado === 'string'
  && crypto.timingSafeEqual(sha256(recibido), sha256(guardado));

export const buscarParaCalificar = (id) =>
  prisma.consulta.findUnique({
    where: { id },
    select: { usuarioId: true, calificarToken: true },
  });

// La fila queda para las métricas; solo se desvincula del historial de la persona.
export const quitarDelHistorial = async (id, usuarioId) => {
  const { count } = await prisma.consulta.updateMany({
    where: { id, usuarioId },
    data: { usuarioId: null },
  });
  return count === 1;
};

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const filtroFecha = (desde, hasta) => {
  const fecha = {};
  if (desde) fecha.gte = new Date(desde);
  if (hasta && SOLO_FECHA.test(hasta)) {
    // Con solo la fecha, "hasta" incluye ese día entero (en UTC).
    const finDelDia = new Date(hasta);
    finDelDia.setUTCDate(finDelDia.getUTCDate() + 1);
    fecha.lt = finDelDia;
  } else if (hasta) {
    fecha.lte = new Date(hasta);
  }
  return fecha;
};

const normalizarMotivo = (motivo) => motivo.trim().toLowerCase();
const motivoCanonico = new Map(MOTIVOS_PREDEFINIDOS.map((m) => [normalizarMotivo(m), m]));

const agruparMotivos = (grupos) => {
  const conteo = new Map([...MOTIVOS_PREDEFINIDOS, OTRO_MOTIVO].map((m) => [m, 0]));
  for (const g of grupos) {
    const motivo = motivoCanonico.get(normalizarMotivo(g.motivoCalificacion)) ?? OTRO_MOTIVO;
    conteo.set(motivo, conteo.get(motivo) + g._count._all);
  }
  return [...conteo].map(([motivo, cantidad]) => ({ motivo, cantidad }));
};

// sectorIds null = sin restricción (SU). Nunca se devuelven usuarioId ni calificarToken.
export const listarCalificaciones = async ({ desde, hasta, tramiteId, calificacion, page, limit, sectorIds }) => {
  const where = {
    calificacion: calificacion ?? { not: null },
    fecha: filtroFecha(desde, hasta),
    ...(tramiteId && { tramiteId }),
    ...(sectorIds && { tramite: { sectorId: { in: sectorIds } } }),
  };

  const [porCalificacion, motivos, topicos, items] = await Promise.all([
    prisma.consulta.groupBy({ by: ['calificacion'], where, _count: { _all: true } }),
    prisma.consulta.groupBy({
      by: ['motivoCalificacion'],
      where: { AND: [where, { calificacion: 0, motivoCalificacion: { not: null } }] },
      _count: { _all: true },
    }),
    prisma.consulta.groupBy({
      by: ['topico'],
      where: { AND: [where, { topico: { not: null } }] },
      _count: { _all: true },
      orderBy: [{ _count: { topico: 'desc' } }, { topico: 'asc' }],
    }),
    prisma.consulta.findMany({
      where,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, fecha: true, textoConsulta: true, respuesta: true,
        calificacion: true, motivoCalificacion: true, topico: true, tramiteId: true,
      },
    }),
  ]);

  const cantidad = (valor) => porCalificacion.find((g) => g.calificacion === valor)?._count._all ?? 0;
  const utiles = cantidad(1);
  const noUtiles = cantidad(0);
  const total = utiles + noUtiles;

  return {
    resumen: {
      total,
      utiles,
      noUtiles,
      satisfaccion: total > 0 ? Math.round((utiles * 1000) / total) / 10 : null,
      porMotivo: agruparMotivos(motivos),
      porTopico: topicos.map((g) => ({ topico: g.topico, cantidad: g._count._all })),
    },
    items,
    page,
    total,
  };
};

// Solo califica si todavía no tiene calificación: dos pedidos simultáneos no se pisan.
export const guardarCalificacion = async (id, calificacion, motivo) => {
  const { count } = await prisma.consulta.updateMany({
    where: { id, calificacion: null },
    data: { calificacion, motivoCalificacion: motivo },
  });
  return count === 1;
};
