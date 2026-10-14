import prisma from '../config/prisma.js';
import { generarEmbedding } from './embedding.service.js';

export const buscarTramites = async (pregunta, limite = 5) => {
  const embedding = await generarEmbedding(pregunta);
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
      AND (
        embedding <=> ${vectorSql}::vector < 0.8
        OR search_vector @@ plainto_tsquery('spanish', ${pregunta})
      )
    ORDER BY score DESC
    LIMIT ${limite}
  `;

  return resultados;
};