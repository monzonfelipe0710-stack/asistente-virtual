import prisma from '../config/prisma.js';

export const crearSector = async (datos) => {
  return prisma.sector.create({ data: datos });
};

export const listarSectores = async () => {
  return prisma.sector.findMany({
    orderBy: {nombre: 'asc'}
  });  
};

export const obtenerSectorPorId = async (id) => {
  return prisma.sector.findUnique({ where: { id } });
};

export const actualizarSector = async (id, datos) => {
  return prisma.sector.update({
    where: { id },
    data: datos,
  });
};

export const eliminarSector = async (id) => {
  return prisma.sector.delete({where: { id } });
};
