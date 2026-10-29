import { ia } from '../core/ai/index.js';
import prisma from '../config/prisma.js';

export const generarEmbedding = (texto) => ia.generarEmbedding(texto);

export const textoDeTramite = (tramite) => {
  const partes = [
    `Trámite: ${tramite.nombre}.`,
    `Descripción: ${tramite.descripcion}.`,
  ];

  if (tramite.requisitos && tramite.requisitos.length > 0) {
    const reqs = tramite.requisitos.map((r) => r.descripcion).join(', ');
    partes.push(`Requisitos: ${reqs}.`);
  }

  return partes.join(' ');
};

export const guardarEmbedding = async (tramiteId, embedding) => {
  const vectorSql = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
  UPDATE tramites
  SET embedding = ${vectorSql}::vector
  WHERE id = ${tramiteId}
  `;
};

export const indexarTramite = async (tramiteId) => {
  const tramite = await prisma.tramite.findUnique({
    where: { id : tramiteId },
    include: { requisitos: true },
  });

  if (!tramite) return;

  const texto = textoDeTramite(tramite);
  const embedding = await generarEmbedding(texto);
  await guardarEmbedding(tramiteId, embedding);
};