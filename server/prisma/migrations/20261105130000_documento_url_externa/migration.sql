-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
-- Un documento es un archivo en R2 (clave en "archivo") o un enlace externo ("url_externa"):
-- exactamente uno de los dos.
ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "url_externa" TEXT;
ALTER TABLE "documentos" ALTER COLUMN "archivo" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_archivo_o_url_externa') THEN
    ALTER TABLE "documentos" ADD CONSTRAINT "documentos_archivo_o_url_externa"
      CHECK (("archivo" IS NULL) <> ("url_externa" IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentos_url_externa_http') THEN
    ALTER TABLE "documentos" ADD CONSTRAINT "documentos_url_externa_http"
      CHECK ("url_externa" IS NULL OR "url_externa" ~* '^https?://');
  END IF;
END $$;
