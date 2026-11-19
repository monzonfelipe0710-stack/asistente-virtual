-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPERUSUARIO', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoSector" AS ENUM ('MINISTERIO', 'SUBSECRETARIA', 'DEPARTAMENTO');

-- CreateTable
CREATE TABLE "sectores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoSector" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "sectores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramites" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" DECIMAL(12,2),
    "encargado" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1546),
    "sector_id" INTEGER NOT NULL,

    CONSTRAINT "tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "donde_se_consigue" TEXT,
    "costo" DECIMAL(12,2),
    "tramite_id" INTEGER NOT NULL,

    CONSTRAINT "requisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas_entrada" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "localidad" TEXT,
    "es_general" BOOLEAN NOT NULL DEFAULT false,
    "sector_id" INTEGER,

    CONSTRAINT "mesas_entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramite_mesa" (
    "tramite_id" INTEGER NOT NULL,
    "mesa_id" INTEGER NOT NULL,

    CONSTRAINT "tramite_mesa_pkey" PRIMARY KEY ("tramite_id","mesa_id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "tipo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tramite_id" INTEGER NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMINISTRADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_sector" (
    "usuario_id" INTEGER NOT NULL,
    "sector_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_sector_pkey" PRIMARY KEY ("usuario_id","sector_id")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" SERIAL NOT NULL,
    "texto_consulta" TEXT NOT NULL,
    "encontrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tramite_id" INTEGER,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sectores_parent_id_idx" ON "sectores"("parent_id");

-- CreateIndex
CREATE INDEX "tramites_sector_id_idx" ON "tramites"("sector_id");

-- CreateIndex
CREATE INDEX "requisitos_tramite_id_idx" ON "requisitos"("tramite_id");

-- CreateIndex
CREATE INDEX "mesas_entrada_sector_id_idx" ON "mesas_entrada"("sector_id");

-- CreateIndex
CREATE INDEX "documentos_tramite_id_idx" ON "documentos"("tramite_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "sectores" ADD CONSTRAINT "sectores_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sectores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos" ADD CONSTRAINT "requisitos_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas_entrada" ADD CONSTRAINT "mesas_entrada_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramite_mesa" ADD CONSTRAINT "tramite_mesa_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramite_mesa" ADD CONSTRAINT "tramite_mesa_mesa_id_fkey" FOREIGN KEY ("mesa_id") REFERENCES "mesas_entrada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_sector" ADD CONSTRAINT "usuario_sector_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_sector" ADD CONSTRAINT "usuario_sector_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
