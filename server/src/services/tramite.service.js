import prisma from '../config/prisma.js';
import { indexarTramite, indexarSiFalta } from './embedding.service.js';
import { eliminarArchivos } from './documento.service.js';
import * as cache from './cache.service.js';

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
          create: [...new Set(mesaIds)].map((mesaId) => ({ mesaId })),
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

  cache.limpiar();
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

// Catálogo público: solo publicados y solo id + nombre, sin datos de gestión.
export const listarPublicados = async () => {
  return prisma.tramite.findMany({
    where: { publicado: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
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

export const obtenerSectorIdDeTramite = async (id) => {
  const tramite = await prisma.tramite.findUnique({ where: { id }, select: { sectorId: true } });
  return tramite?.sectorId ?? null;
};

export const obtenerMesaIdsDeTramite = async (id) => {
  const filas = await prisma.tramiteMesa.findMany({ where: { tramiteId: id }, select: { mesaId: true } });
  return filas.map((f) => f.mesaId);
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

  cache.limpiar();
  return eliminado;
};

export const cambiarPublicacion = async (id, publicado) => {
  const tramite = await prisma.tramite.update({
    where: { id },
    data: { publicado },
  });
  cache.limpiar();

  // Si falló el embedding al crearlo, el chat no lo encontraría aunque esté publicado.
  if (publicado) {
    indexarSiFalta(id)
      .then((indexado) => indexado && cache.limpiar())
      .catch((err) => {
        console.error(`Error al indexar el trámite ${id} al publicarlo`, err.message);
      });
  }

  return tramite;
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
      const unicos = [...new Set(mesaIds)];
      if (unicos.length > 0) {
        await tx.tramiteMesa.createMany({
          data: unicos.map((mesaId) => ({ tramiteId: id, mesaId })),
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

  indexarTramite(id)
    .then(cache.limpiar)
    .catch((err) => {
      console.error(`Error al reindexar el trámite ${id}`, err.message);
    });

  cache.limpiar();
  return tramiteActualizado;
};