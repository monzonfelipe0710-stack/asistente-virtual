-- Renombra la tabla Consulta a "consultas" para unificar el snake_case del resto
-- del esquema. Se usa RENAME en lugar de DROP/CREATE para no perder datos.
ALTER TABLE "Consulta" RENAME TO "consultas";
ALTER TABLE "consultas" RENAME CONSTRAINT "Consulta_pkey" TO "consultas_pkey";
ALTER TABLE "consultas" RENAME CONSTRAINT "Consulta_tramite_id_fkey" TO "consultas_tramite_id_fkey";
ALTER SEQUENCE "Consulta_id_seq" RENAME TO "consultas_id_seq";

-- Unifica el nombre de la columna con el de los demás modelos.
ALTER TABLE "tramites" RENAME COLUMN "createdAt" TO "created_at";

-- Corrige la dimensión del embedding: 1536 es la de text-embedding-3-small.
-- Prisma no genera este cambio solo porque el tipo es Unsupported().
ALTER TABLE "tramites" ALTER COLUMN "embedding" TYPE vector(1536);

-- CreateIndex
CREATE INDEX "consultas_tramite_id_idx" ON "consultas"("tramite_id");

-- CreateIndex
CREATE UNIQUE INDEX "sectores_nombre_parent_id_key" ON "sectores"("nombre", "parent_id");
