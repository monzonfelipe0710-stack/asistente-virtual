import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import { generarEmbedding } from './embedding.service.js';
import { conSenal } from '../utils/plazo.js';

const UMBRAL_DISTANCIA = Number(process.env.UMBRAL_DISTANCIA ?? 0.5);

// El mismo nombre normalizado que en JS: minúsculas, sin acentos, espacios colapsados.
const clave = (columna) => Prisma.sql`regexp_replace(translate(lower(trim(${columna})), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'), '\\s+', ' ', 'g')`;

// Devuelve los `limite` grupos de nombre con mejor puntaje, cada uno con todas sus variantes
// publicadas (el mismo trámite en distintos organismos), y no solo las que pasaron el filtro:
// así la lista de localidades está completa y las copias no ocupan el lugar de otros trámites.
// `id` es la variante de mejor puntaje.
export const buscarTramites = async (pregunta, { limite = 3, signal } = {}) => {
  const embedding = await generarEmbedding(pregunta, { signal });
  const vectorSql = `[${embedding.join(',')}]`;
  const consulta = Prisma.sql`replace(plainto_tsquery('spanish', ${pregunta})::text, '&', '|')::tsquery`;

  const filas = await conSenal(prisma.$queryRaw`
    WITH puntuados AS (
      SELECT
        id,
        ${clave(Prisma.sql`nombre`)} AS clave,
        0.6 * (1 - (embedding <=> ${vectorSql}::vector)) + 0.4 * ts_rank(search_vector, ${consulta}) AS score
      FROM tramites
      WHERE publicado = true
        AND embedding IS NOT NULL
        AND (
          (embedding <=> ${vectorSql}::vector) < ${UMBRAL_DISTANCIA}
          OR search_vector @@ ${consulta}
        )
    ),
    grupos AS (
      SELECT clave, max(score) AS mejor
      FROM puntuados
      GROUP BY clave
      ORDER BY mejor DESC
      LIMIT ${limite}
    )
    SELECT t.id, t.nombre, t.sector_id AS "sectorId", g.clave, g.mejor, p.score
    FROM grupos g
    JOIN tramites t ON t.publicado = true AND ${clave(Prisma.sql`t.nombre`)} = g.clave
    LEFT JOIN puntuados p ON p.id = t.id
    ORDER BY g.mejor DESC, p.score DESC NULLS LAST, t.id
  `, signal);

  const grupos = new Map();
  for (const f of filas) {
    if (!grupos.has(f.clave)) grupos.set(f.clave, { id: f.id, nombre: f.nombre, variantes: [] });
    grupos.get(f.clave).variantes.push({ id: f.id, nombre: f.nombre, sectorId: f.sectorId });
  }
  return [...grupos.values()];
};
