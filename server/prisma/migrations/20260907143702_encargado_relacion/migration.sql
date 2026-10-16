/*
  Warnings:

  - You are about to drop the column `encargado` on the `tramites` table. All the data in the column will be lost.
  - Added the required column `encargado_id` to the `tramites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tramites" DROP COLUMN "encargado",
ADD COLUMN     "encargado_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_encargado_id_fkey" FOREIGN KEY ("encargado_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
