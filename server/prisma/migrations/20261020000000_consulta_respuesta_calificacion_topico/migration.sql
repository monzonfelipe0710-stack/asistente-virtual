-- Agrega campos de respuesta, calificación y tópico a las consultas del chat.
ALTER TABLE "consultas" ADD COLUMN IF NOT EXISTS "respuesta" TEXT;
ALTER TABLE "consultas" ADD COLUMN IF NOT EXISTS "calificacion" INTEGER;
ALTER TABLE "consultas" ADD COLUMN IF NOT EXISTS "topico" TEXT;
