import 'dotenv/config';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// La búsqueda del chat depende de esta columna y estos índices, que se crean con
// SQL crudo y ya se perdieron una vez por una migración generada.
describe('invariantes de búsqueda en tramites', () => {
  after(() => prisma.$disconnect());

  it('existe la columna search_vector', async () => {
    const filas = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tramites' AND column_name = 'search_vector'`;
    assert.equal(filas.length, 1);
  });

  it('existen los índices HNSW y GIN de búsqueda', async () => {
    const filas = await prisma.$queryRaw`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE tablename = 'tramites'
        AND indexname IN ('tramites_embedding_idx', 'tramites_search_idx')`;
    const porNombre = Object.fromEntries(filas.map((f) => [f.indexname, f.indexdef]));

    assert.match(porNombre.tramites_embedding_idx ?? '', /USING hnsw/);
    assert.match(porNombre.tramites_search_idx ?? '', /USING gin/);
  });
});
