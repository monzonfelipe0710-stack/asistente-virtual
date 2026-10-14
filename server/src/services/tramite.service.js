import prisma from '../config/prisma.js';
import { indexarTramite } from './embedding.service.js';

export const crearTramite = async (datos, encargadoId) => {
  const { requisitos, mesaIds, ...datosTramite } = datos;

  const tramite = await prisma.$transaction(async (tx) => {
    return tx.tramite.create({
      data: {
        ...datosTramite,
        encargadoId,
        requisitos: {
          create: requisitos,
        },
        mesas: {
          create: mesaIds.map((mesaId) => ({ mesaId })),
        },
      },
      include: {
        requisitos: true,
        mesas: true,
      },
    });
  });

  indexarTramite(tramite.id).catch((err) => {
    console.error(`Error al indexar el tramite ${tramite.id}`, err.message);
  });

  return tramite;
};

export const listarTramites = async () => {
  return prisma.tramite.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      sector: { select: {id: true, nombre: true } },
      encargado: { select: { id: true, nombre: true} },
    },
  });
};

export const obtenerTramitePorId = async (id) => {
  return prisma.tramite.findUnique({
    where: { id },
    include: {
      requisitos: true,
      mesas: { include: { mesa: true} },
      sector: { select: { id: true, nombre: true} },
      encargado: {select: { id: true, nombre: true} },
    },
  });
};

export const eliminarTramite = async (id) => {
  return prisma.tramite.delete({where: { id } });
};

export const cambiarPublicacion = async (id, publicado) => {
  return prisma.tramite.update({
    where: { id },
    data: { publicado },
  });
};

export const actualizarTramite = async (id, datos) => {
  const { requisitos, mesaIds, ...datosTramite } = datos;

  const tramiteActualizado = await prisma.$transaction(async (tx) => {
    await tx.tramite.update({
      where: { id },
      data: datosTramite,
    });

    if (requisitos !== undefined) {
      await tx.requisito.deleteMany({ where: { tramiteId: id } });
      if (requisitos.length > 0) {
        await tx.requisito.createMany({
          data: requisitos.map((r) => ({ ...r, tramiteId: id })),
        });
      }
    }

    if (mesaIds !== undefined) {
      await tx.tramiteMesa.deleteMany({ where: { tramiteId: id } });
      if (mesaIds.length > 0) {
        await tx.tramiteMesa.createMany({
          data: mesaIds.map((mesaId) => ({ tramiteId: id, mesaId })),
        });
      }
    }

    return tx.tramite.findUnique({
      where: { id },
      include: {
        requisitos: true,
        mesas: { include: { mesa: true } },
        sector: { select: { id: true, nombre: true } },
        encargado: { select: { id: true, nombre: true } },
      },
    });
  });

  indexarTramite(id).catch((err) => {
    console.error(`Error al reindexar el trámite ${id}`, err.message);
  });

  return tramiteActualizado;
};