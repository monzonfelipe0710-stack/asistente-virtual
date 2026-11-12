/*
  Warnings:

  - You are about to drop the column `search_vector` on the `tramites` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fuente_url]` on the table `tramites` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tramites_embedding_idx";

-- DropIndex
DROP INDEX "tramites_search_idx";

-- AlterTable
ALTER TABLE "tramites" DROP COLUMN "search_vector",
ADD COLUMN     "fuente_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tramites_fuente_url_key" ON "tramites"("fuente_url");
