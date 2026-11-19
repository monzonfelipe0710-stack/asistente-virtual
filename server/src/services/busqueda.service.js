import prisma from '../config/prisma.js';
import { generarEmbedding } from './embedding.service.js';
import { conSenal } from '../utils/plazo.js';
import * as cache from './cache.service.js';

const UMBRAL_DISTANCIA = Number(process.env.UMBRAL_DISTANCIA ?? 0.5);

const embeddingDe = async (pregunta, { signal, cachear }) => {
  const guardado = cachear ? cache.obtenerEmbedding(pregunta) : null;
  if (guardado) return guardado;
  const embedding = await generarEmbedding(pregunta, { signal });
  if (cachear) cache.guardarEmbedding(pregunta, embedding);
  return embedding;
};

// El mismo nombre normalizado que en JS: minúsculas, sin acentos, espacios colapsados.
const clave = (columna) => Prisma.sql`regexp_replace(translate(lower(trim(${columna})), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'), '\\s+', ' ', 'g')`;

// Devuelve los `limite` grupos de nombre con mejor puntaje, cada uno con todas sus variantes
// publicadas (el mismo trámite en distintos organismos), y no solo las que pasaron el filtro:
// así la lista de localidades está completa y las copias no ocupan el lugar de otros trámites.
// `id` es la variante de mejor puntaje. `alEtapa` avisa cuándo empieza el embedding y cuándo la
// consulta a la base (para el log de latencia del chat). Con `cachearEmbedding` el embedding de la
// pregunta se reusa (cache.service.js): el chat lo pide solo para las consultas de un turno.
// `alPuntaje` recibe el puntaje del mejor grupo, o null si no hubo ninguno.
export const buscarTramites = async (pregunta, { limite = 3, signal, alEtapa, alPuntaje, cachearEmbedding = false } = {}) => {
  alEtapa?.('embedding');
  const embedding = await embeddingDe(pregunta, { signal, cachear: cachearEmbedding });
  alEtapa?.('busqueda');
  const vectorSql = `[${embedding.join(',')}]`;

  const resultados = await prisma.$queryRaw`
    SELECT
      id,
      nombre,
      descripcion,
      costo,
      (
        0.6 * (1 - (embedding <=> ${vectorSql}::vector))
        +
        0.4 * ts_rank(search_vector, plainto_tsquery('spanish', ${pregunta}))
      ) AS score
    FROM tramites
    WHERE publicado = true
      AND embedding IS NOT NULL
      AND (embedding <=> ${vectorSql}::vector) < ${UMBRAL_DISTANCIA}
    ORDER BY score DESC
    LIMIT ${limite}
  `;

  const grupos = new Map();
  for (const f of filas) {
    if (!grupos.has(f.clave)) grupos.set(f.clave, { id: f.id, nombre: f.nombre, mejor: Number(f.mejor), variantes: [] });
    grupos.get(f.clave).variantes.push({ id: f.id, nombre: f.nombre, sectorId: f.sectorId });
  }
  const ordenados = [...grupos.values()];
  alPuntaje?.(ordenados[0]?.mejor ?? null);
  return soloLosCercanos(ordenados).map(({ mejor, ...grupo }) => grupo);
};

// Un candidato con un puntaje mucho menor que el primero no va al contexto: el modelo ve a todos
// los candidatos con el mismo peso y pregunta entre trámites que no compiten ("licencia de
// conducir": la nacional 0,344 y la de taxis 0,282, el 82 %). Medido el 09-11-2026, la opción
// legítima más lejana de una aclaración del eval quedaba en el 89 % del primero (pesca deportiva
// en "cómo saco la licencia de pesca").
export const PROPORCION_DEL_PRIMERO = 0.85;
export const soloLosCercanos = (grupos) => {
  const primero = grupos[0]?.mejor;
  if (!(primero > 0)) return grupos;
  return grupos.filter((g) => g.mejor >= PROPORCION_DEL_PRIMERO * primero);
};
