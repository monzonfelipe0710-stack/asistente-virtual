import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';

export const registrarSolicitud = async (datos) => {
  const passwordHash = await bcrypt.hash(datos.password, 10);

  return prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      passwordHash,
      rol: 'ADMINISTRADOR',
    },
  });
};

export const buscarPorEmail = async (email) => {
  return prisma.usurio.findUnique({ where: {email} });
};

export const listarPendientes = async () => {
  return prisma.usuario.findMany({
    where: {estado: 'PENDIENTE'},
    select: { id: true, nombre: true, email: true, estado: true, createdAt: true},
    orderBy: { createdAt: 'asc'},
  });
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