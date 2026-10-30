import prisma from '../config/prisma.js';
import { generarEmbedding } from './embedding.service.js';

const UMBRAL_DISTANCIA = Number(process.env.UMBRAL_DISTANCIA ?? 0.5);

const normalizarNombre = (nombre) =>
  nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

export const buscarTramites = async (pregunta, limite = 3) => {
  const embedding = await generarEmbedding(pregunta);
  const vectorSql = `[${embedding.join(',')}]`;

  // Se piden de más porque el catálogo tiene trámites repetidos (mismo nombre en
  // distintos organismos) que, si no, ocupan todos los lugares del contexto.
  const candidatos = await prisma.$queryRaw`
    SELECT
      id,
      nombre,
      descripcion,
      costo,
      (
        0.6 * (1 - (embedding <=> ${vectorSql}::vector))
        +
        0.4 * ts_rank(search_vector, replace(plainto_tsquery('spanish', ${pregunta})::text, '&', '|')::tsquery)
      ) AS score
    FROM tramites
    WHERE publicado = true
      AND embedding IS NOT NULL
      AND (
        (embedding <=> ${vectorSql}::vector) < ${UMBRAL_DISTANCIA}
        OR search_vector @@ replace(plainto_tsquery('spanish', ${pregunta})::text, '&', '|')::tsquery
      )
    ORDER BY score DESC
    LIMIT ${limite * 4}
  `;

  // Vienen ordenados por score: el primero de cada nombre es el de mejor puntaje.
  const vistos = new Set();
  const unicos = [];
  for (const t of candidatos) {
    const clave = normalizarNombre(t.nombre);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicos.push(t);
    if (unicos.length === limite) break;
  }
  return unicos;
};