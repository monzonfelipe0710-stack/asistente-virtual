-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
-- Una sola fila: cada proceso que cambia el catálogo incrementa la versión y el servidor vacía
-- su caché cuando la ve cambiada.
CREATE TABLE IF NOT EXISTS "catalogo_version" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "version" BIGINT NOT NULL DEFAULT 0,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalogo_version_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "catalogo_version_una_fila" CHECK ("id" = 1)
);

INSERT INTO "catalogo_version" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
