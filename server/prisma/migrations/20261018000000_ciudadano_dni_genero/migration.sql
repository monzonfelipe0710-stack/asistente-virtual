-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('M', 'F');

-- AlterTable
ALTER TABLE "usuarios"
  ADD COLUMN "dni" TEXT,
  ADD COLUMN "genero" "Genero";

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_genero_key" ON "usuarios" ("dni", "genero");