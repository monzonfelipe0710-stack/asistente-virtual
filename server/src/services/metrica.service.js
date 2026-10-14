import prisma from '../config/prisma.js';

export const registrarConsulta = async ({ textoConsulta, tramiteId, encontrado }) => {
  return prisma.consulta.create({
    data: {
      textoConsulta,
      tramiteId: tramiteId ?? null,
      encontrado,
    },
  });
};

export const consultasPorTramite = async () => {
  return prisma.consulta.groupBy({
    by: ['tramiteId'],
    where: { encontrado: true },
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