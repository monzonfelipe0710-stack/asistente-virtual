ALTER TABLE "usuarios" ADD COLUMN "cuil" TEXT;
CREATE UNIQUE INDEX "usuarios_cuil_key" ON "usuarios"("cuil");

ALTER TABLE "consultas" ADD COLUMN "calificacion" INTEGER;
