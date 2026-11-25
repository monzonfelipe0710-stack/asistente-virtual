CREATE INDEX IF NOT EXISTS tramites_embedding_idx
  ON tramites USING hnsw (embedding vector_cosine_ops);

ALTER TABLE tramites
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(descripcion, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS tramites_search_idx
  ON tramites USING gin (search_vector);