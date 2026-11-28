-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Jurisdiccion') THEN
    CREATE TYPE "Jurisdiccion" AS ENUM ('PROVINCIAL', 'MUNICIPAL', 'NACIONAL');
  END IF;
END $$;

ALTER TABLE "sectores"
  ADD COLUMN IF NOT EXISTS "jurisdiccion" "Jurisdiccion",
  ADD COLUMN IF NOT EXISTS "localidad" TEXT;

-- Los sectores raíz existentes son provinciales; los hijos quedan en null y heredan.
UPDATE "sectores" SET "jurisdiccion" = 'PROVINCIAL' WHERE "parent_id" IS NULL AND "jurisdiccion" IS NULL;
