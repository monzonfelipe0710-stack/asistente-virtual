-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
-- consultas.tipo distingue una aclaración del chat (cuando repregunta cuál trámite) de una consulta
-- respondida. Las filas existentes, y las que escriba otro proceso sin la columna, quedan en
-- 'respuesta': las métricas que filtran por tipo dan lo mismo que antes.
ALTER TABLE "consultas" ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'respuesta';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultas_tipo_check' AND conrelid = '"consultas"'::regclass
  ) THEN
    ALTER TABLE "consultas" ADD CONSTRAINT "consultas_tipo_check" CHECK ("tipo" IN ('respuesta', 'aclaracion'));
  END IF;
END $$;
