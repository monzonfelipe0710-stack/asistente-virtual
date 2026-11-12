-- Escrita a mano. IF NOT EXISTS porque en algunas bases estas columnas ya las crearon
-- migraciones de otra rama que no están en el repo.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cuil" VARCHAR(11);
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_cuil_key" ON "usuarios" ("cuil");

ALTER TABLE "consultas"
  ADD COLUMN IF NOT EXISTS "calificacion" INTEGER,
  ADD COLUMN IF NOT EXISTS "motivo_calificacion" TEXT,
  ADD COLUMN IF NOT EXISTS "respuesta" TEXT,
  ADD COLUMN IF NOT EXISTS "topico" TEXT,
  ADD COLUMN IF NOT EXISTS "calificar_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "consultas_calificar_token_key" ON "consultas" ("calificar_token");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultas_calificacion_check' AND conrelid = '"consultas"'::regclass
  ) THEN
    ALTER TABLE "consultas" ADD CONSTRAINT "consultas_calificacion_check" CHECK ("calificacion" IN (0, 1));
  END IF;
END $$;
