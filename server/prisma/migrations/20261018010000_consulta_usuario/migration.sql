-- AlterTable
ALTER TABLE "consultas" ADD COLUMN "usuario_id" INTEGER;

-- AddForeignKey
ALTER TABLE "consultas"
  ADD CONSTRAINT "consultas_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "consultas_usuario_id_idx" ON "consultas" ("usuario_id");