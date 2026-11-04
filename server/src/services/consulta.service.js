import crypto from 'node:crypto';
import prisma from '../config/prisma.js';

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

// Solo califica si todavía no tiene calificación: dos pedidos simultáneos no se pisan.
export const guardarCalificacion = async (id, calificacion, motivo) => {
  const { count } = await prisma.consulta.updateMany({
    where: { id, calificacion: null },
    data: { calificacion, motivoCalificacion: motivo },
  });
  return count === 1;
};
