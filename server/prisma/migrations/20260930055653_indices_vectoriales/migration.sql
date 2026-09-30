-- Índice vectorial (HNSW) para búsqueda semántica por similitud (coseno)
CREATE INDEX IF NOT EXISTS tramites_embedding_idx
  ON tramites USING hnsw (embedding vector_cosine_ops);

-- Columna generada para full-text search en español (nombre + descripción)
ALTER TABLE tramites
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(descripcion, ''))
  ) STORED;

-- Índice GIN para que la búsqueda de texto sea rápida
CREATE INDEX IF NOT EXISTS tramites_search_idx
  ON tramites USING gin (search_vector);