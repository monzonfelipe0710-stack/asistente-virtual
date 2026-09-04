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