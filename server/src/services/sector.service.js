import prisma from '../config/prisma.js';
import * as cache from './cache.service.js';
import { indexarTramite, tramitesDeSectores } from './embedding.service.js';
import { JURISDICCION_POR_DEFECTO, leerSectoresParaResolver, municipalSinLocalidad } from './jurisdiccion.service.js';

const NUEVO = 0;

// Con el cambio aplicado en memoria, el sector y sus descendientes municipales tienen que
// tener localidad. `id` null es un sector nuevo.
const validarLocalidad = async (id, datos) => {
  const sectores = await leerSectoresParaResolver();
  const lista = id === null
    ? [...sectores, { id: NUEVO, parentId: null, jurisdiccion: null, localidad: null, ...datos }]
    : sectores.map((s) => (s.id === id ? { ...s, ...datos } : s));
  if (municipalSinLocalidad(lista, id ?? NUEVO) !== undefined) {
    const error = new Error('Un sector municipal necesita una localidad, propia o heredada del sector padre.');
    error.statusCode = 400;
    throw error;
  }
};

// La jurisdicción, la localidad y el nombre de los sectores entran en las respuestas del chat.
export const crearSector = async (datos) => {
  const completos = datos.parentId == null && datos.jurisdiccion == null
    ? { ...datos, jurisdiccion: JURISDICCION_POR_DEFECTO }
    : datos;
  await validarLocalidad(null, completos);
  const sector = await prisma.sector.create({ data: completos });
  cache.limpiar();
  return sector;
};

export const listarSectores = async () => {
  return prisma.sector.findMany({
    orderBy: {nombre: 'asc'}
  });  
};

export const obtenerSectorPorId = async (id) => {
  return prisma.sector.findUnique({ where: { id } });
};

// El nombre, la jurisdicción, la localidad y el padre entran en el texto del embedding de los
// trámites del sector y de sus descendientes: si cambian, se reindexan en segundo plano.
const CAMPOS_DEL_EMBEDDING = ['nombre', 'jurisdiccion', 'localidad', 'parentId'];

const reindexarTramitesDe = async (id) => {
  for (const tramiteId of await tramitesDeSectores([id])) {
    try {
      await indexarTramite(tramiteId);
    } catch (err) {
      console.error(`Error al reindexar el trámite ${tramiteId} por el cambio del sector ${id}`, err.message);
    }
  }
  cache.limpiar();
};

export const actualizarSector = async (id, datos) => {
  await validarLocalidad(id, datos);
  const anterior = await prisma.sector.findUnique({ where: { id } });
  const sector = await prisma.sector.update({
    where: { id },
    data: datos,
  });
  cache.limpiar();
  if (CAMPOS_DEL_EMBEDDING.some((campo) => campo in datos && anterior?.[campo] !== sector[campo])) {
    reindexarTramitesDe(id).catch((err) => console.error(`Error al reindexar los trámites del sector ${id}`, err.message));
  }
  return sector;
};

export const eliminarSector = async (id) => {
  const eliminado = await prisma.sector.delete({ where: { id } });
  cache.limpiar();
  return eliminado;
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
