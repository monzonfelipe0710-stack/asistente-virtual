-- AlterEnum
-- Se agregan las opciones de género que faltaban en el padrón de turnos:
--   O -> "Otro"
--   X -> "Prefiero no decirlo"
-- Es un enum de Postgres: los valores nuevos no se pueden usar dentro de la
-- misma transacción en que se agregan, por eso van en sentencias separadas.
ALTER TYPE "Genero" ADD VALUE 'O';

-- AlterEnum
ALTER TYPE "Genero" ADD VALUE 'X';
