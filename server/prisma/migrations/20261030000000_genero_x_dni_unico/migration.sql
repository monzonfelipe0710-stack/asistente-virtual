-- Escrita a mano. IF NOT EXISTS / IF EXISTS porque en algunas bases ya se aplicaron
-- migraciones de otra rama que agregan 'O' y 'X' al enum.
ALTER TYPE "Genero" ADD VALUE IF NOT EXISTS 'X';

-- El DNI pasa a ser único por sí solo. Los NULL no chocan entre sí, así que los
-- empleados (sin DNI) no se ven afectados.
DROP INDEX IF EXISTS "usuarios_dni_genero_key";
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_dni_key" ON "usuarios" ("dni");
