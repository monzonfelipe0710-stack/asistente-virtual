import prisma from '../config/prisma.js';
import { indexarTramite } from './embedding.service.js';
import { eliminarArchivos } from './documento.service.js';

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
    console.error(`Error al indexar el trámite ${tramite.id}`, err.message);
  });

  return tramite;
};

export const listarTramitesPublicados = async () => {
  return prisma.tramite.findMany({
    where: { publicado: true },
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      sector: { select: { nombre: true } },
    },
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
  // La cascada de la base borra los registros de documentos, pero no los archivos
  // en R2: hay que leer las keys antes de borrar y limpiarlas después.
  const documentos = await prisma.documento.findMany({
    where: { tramiteId: id },
    select: { archivo: true },
  });

  const eliminado = await prisma.tramite.delete({where: { id } });

  if (documentos.length > 0) {
    await eliminarArchivos(documentos.map((d) => d.archivo));
  }

  return eliminado;
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