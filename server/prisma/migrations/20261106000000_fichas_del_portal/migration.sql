-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
-- Datos de las fichas de formosa.gob.ar (ingestion/sources/detalle_html.py).
--   tramites.informacion_adicional  modalidad, duración, observaciones y paso a paso
--   tramites.costo_detalle          el costo cuando no entra en un decimal (varias filas, UT, ...)
--   tramites.verificado_en          cuándo se capturó la ficha
--   *.huella_importacion            hash de lo que escribió el importador, por grupo de campos:
--                                   si el valor actual ya no coincide, alguien lo editó a mano y
--                                   la reimportación no lo pisa
--   mesas_entrada.origen_id         identificador de la oficina en el sitio (collapse_NNN)
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "informacion_adicional" TEXT;
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "costo_detalle" TEXT;
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "verificado_en" TIMESTAMP(3);
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "huella_importacion" JSONB;

ALTER TABLE "mesas_entrada" ADD COLUMN IF NOT EXISTS "telefono" TEXT;
ALTER TABLE "mesas_entrada" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "mesas_entrada" ADD COLUMN IF NOT EXISTS "origen_id" TEXT;
ALTER TABLE "mesas_entrada" ADD COLUMN IF NOT EXISTS "huella_importacion" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "mesas_entrada_origen_id_key" ON "mesas_entrada"("origen_id");
