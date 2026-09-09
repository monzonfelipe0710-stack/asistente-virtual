import prisma from '../config/prisma.js';

export const crearTramite = async (datos, encargadoId) => {
  const { requisitos, mesaIds, ...datosTramite } = datos;

  return prisma.$transaction(async (tx) => {
    const tramite = await tx.tramite.create({
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

    return tramite;
  });
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

export const actualizarTramite = async (id, datos) => {
  const { requisitos, mesaIds, ...datosTramite } = datos;

  return prisma.$transaction(async (tx) => {
    await tx.tramite.update({
      where: { id },
      data: datosTramite,
    });

    if (requisitos !== undefined) {
      await tx.requisito.deleteMany({ where: { tramiteId: id} });
      if (requisitos.length > 0) {
        await tx.requisito.createMany({
          data: requisitos.map((r) => ({ ...r, tramiteId: id} )),
        });
      }
    }

    if (mesaIds !== undefined) {
      await tx.tramiteMesa.deleteMany({ where: { tramiteId: id} });
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
        mesas: { include: { mesa: true} },
        sector: { select: { id: true, nombre: true } },
        encargado: { select: { id: true, nombre: true} },
      },
    });
  });
};