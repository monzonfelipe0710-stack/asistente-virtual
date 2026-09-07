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

// Determina si asignar `nuevoPadreId` como padre de `id` cerraría un ciclo, es
// decir si `id` ya es ancestro de `nuevoPadreId`. Sin esta validación un sector
// puede terminar siendo su propio antepasado y cualquier recorrido del árbol
// entra en recursión infinita.
export const generariaCiclo = async (id, nuevoPadreId) => {
  if (id === nuevoPadreId) return true;

  // El tope de profundidad evita colgarse si la tabla ya tuviera un ciclo previo.
  const filas = await prisma.$queryRaw`
    WITH RECURSIVE ancestros(id, parent_id, profundidad) AS (
      SELECT id, parent_id, 1 FROM sectores WHERE id = ${nuevoPadreId}
      UNION ALL
      SELECT s.id, s.parent_id, a.profundidad + 1
      FROM sectores s
      JOIN ancestros a ON s.id = a.parent_id
      WHERE a.profundidad < 100
    )
    SELECT 1 AS existe FROM ancestros WHERE id = ${id} LIMIT 1
  `;

  return filas.length > 0;
};
