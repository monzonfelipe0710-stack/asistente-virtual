import prisma from '../config/prisma.js';

export const listarMesas = async () => {
  return prisma.mesaEntrada.findMany({
    orderBy: { nombre: 'asc' },
    include: { sector: { select: { id: true, nombre: true } } },
  });
};

export const obtenerMesa = async (id) => {
  return prisma.mesaEntrada.findUnique({
    where: { id },
    include: { sector: { select: { id: true, nombre: true } } },
  });
};

export const crearMesa = async (datos) => {
  return prisma.mesaEntrada.create({ data: datos });
};

export const actualizarMesa = async (id, datos) => {
  return prisma.mesaEntrada.update({ where: { id }, data: datos });
};

export const eliminarMesa = async (id) => {
  return prisma.mesaEntrada.delete({ where: { id } });
};

export const sectorExiste = async (sectorId) => {
  return (await prisma.sector.count({ where: { id: sectorId } })) > 0;
};

export const contarTramitesDeMesa = async (id) => {
  return prisma.tramiteMesa.count({ where: { mesaId: id } });
};

export const mesasValidasParaSector = async (mesaIds, sectorId) => {
  const ids = [...new Set(mesaIds)];
  if (ids.length === 0) return true;
  const validas = await prisma.mesaEntrada.count({
    where: { id: { in: ids }, OR: [{ esGeneral: true }, { sectorId }] },
  });
  return validas === ids.length;
};
