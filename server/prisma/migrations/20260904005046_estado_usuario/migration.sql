/*
  Warnings:

  - You are about to drop the column `activo` on the `usuarios` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "activo",
ADD COLUMN     "estado" "EstadoUsuario" NOT NULL DEFAULT 'PENDIENTE';
