ALTER TABLE "usuarios" ADD COLUMN "cuil" VARCHAR(11);

CREATE UNIQUE INDEX "usuarios_cuil_key" ON "usuarios"("cuil");
