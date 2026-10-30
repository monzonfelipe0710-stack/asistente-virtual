import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';


export const buscarPorEmail = async (email) => {
  return prisma.usuario.findUnique({ where: {email} });
};

export const cambiarEstado = async (id, nuevoEstado) => {
  return prisma.usuario.update({
    where: { id },
    data: { estado: nuevoEstado },
    select: { id: true, nombre: true, email: true, estado: true},
  });
};

export const obtenerPorId = async (id) => {
  return prisma.usuario.findUnique({ where: {id} });
};

// Lista usuarios, opcionalmente filtrados por estado. Nunca devuelve passwordHash.
export const listarUsuarios = async (estado) => {
  return prisma.usuario.findMany({
    where: estado ? { estado } : undefined,
    select: { id: true, nombre: true, email: true, rol: true, estado: true, createdAt: true },
    orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
  });
};

export const listarSectoresDeUsuario = async (usuarioId) => {
  const filas = await prisma.usuarioSector.findMany({
    where: { usuarioId },
    select: { sector: { select: { id: true, nombre: true, tipo: true } } },
    orderBy: { sectorId: 'asc' },
  });
  return filas.map((f) => f.sector);
};

export const usuarioTieneSector = async (usuarioId, sectorId) => {
  const fila = await prisma.usuarioSector.findUnique({
    where: { usuarioId_sectorId: { usuarioId, sectorId } },
  });
  return fila !== null;
};

export const contarSectoresExistentes = async (ids) => {
  return prisma.sector.count({ where: { id: { in: ids } } });
};

export const asignarSectores = async (usuarioId, sectorIds) => {
  return prisma.$transaction(async (tx) =>{
    await tx.usuarioSector.deleteMany({ where: { usuarioId} });
    if (sectorIds.length > 0) {
      await tx.usuarioSector.createMany({
        data: sectorIds.map((sectorId) => ({ usuarioId, sectorId })),
        skipDuplicates: true,
      });
    }
    const filas = await tx.usuarioSector.findMany({
      where: { usuarioId },
      select: { sector: { select: { id: true, nombre: true, tipo: true } } },
      orderBy: { sectorId: 'asc' },
    });
    return filas.map((f) => f.sector);
  });
};

export const registrarCiudadano = async (datos) => {
  const passwordHash = await bcrypt.hash(datos.password, 10);

  return prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      passwordHash,
      rol: 'CIUDADANO',
      estado: 'APROBADO',
      dni: datos.dni,
      genero: datos.genero,
    },
    select: { id: true, nombre: true, email: true, rol: true },
  });
};

export const buscarPorDni = async (dni) => {
  return prisma.usuario.findUnique({ where: { dni } });
};

export const guardarTokenRecuperacion = async (id, tokenHash, expira) => {
  return prisma.usuario.update({
    where: { id },
    data: { resetTokenHash: tokenHash, resetTokenExpira: expira },
  });
};

export const buscarPorTokenRecuperacion = async (tokenHash) => {
  return prisma.usuario.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpira: { gt: new Date() },
    },
  });
};

export const cambiarPassword = async (id, passwordNueva) => {
  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  return prisma.usuario.update({
    where: { id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpira: null,
      debeCambiarPassword: false,
      passwordCambiadaEn: new Date(),
    },
  });
};

export const crearEmpleado = async ({ nombre, email, password, sectorIds = [] }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'APROBADO',
      debeCambiarPassword: true,
      sectores: { create: sectorIds.map((sectorId) => ({ sectorId })) },
    },
    select: { id: true, nombre: true, email: true, rol: true, estado: true },
  });
};