-- Escrita a mano e idempotente: se puede aplicar de nuevo sin error.
-- Selector del modelo de chat: la lista cerrada de modelos (con sus parámetros, precios y la última
-- evaluación), el modelo activo (una sola fila) y la auditoría de los cambios. consultas.modelo guarda
-- qué modelo respondió cada consulta. Los modelos salen de src/config/modelos-chat.json: al principio
-- solo gpt-4o-mini está habilitado y es el por defecto.
CREATE TABLE IF NOT EXISTS "modelo_chat" (
  "id" TEXT NOT NULL,
  "proveedor" TEXT NOT NULL,
  "modelo_api" TEXT NOT NULL,
  "nombre_visible" TEXT NOT NULL,
  "parametros" JSONB NOT NULL DEFAULT '{}',
  "precios" JSONB NOT NULL DEFAULT '{}',
  "habilitado" BOOLEAN NOT NULL DEFAULT false,
  "estado_eval" JSONB,
  "es_por_defecto" BOOLEAN NOT NULL DEFAULT false,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "modelo_chat_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "modelo_chat_proveedor" CHECK ("proveedor" IN ('openai', 'anthropic', 'google'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "modelo_chat_un_por_defecto" ON "modelo_chat" ("es_por_defecto") WHERE "es_por_defecto";

CREATE TABLE IF NOT EXISTS "configuracion_chat" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "modelo_activo_id" TEXT NOT NULL,
  "actualizado_por" INTEGER,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "configuracion_chat_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "configuracion_chat_una_fila" CHECK ("id" = 1),
  CONSTRAINT "configuracion_chat_modelo_activo_id_fkey" FOREIGN KEY ("modelo_activo_id") REFERENCES "modelo_chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "configuracion_chat_actualizado_por_fkey" FOREIGN KEY ("actualizado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "auditoria_modelo_chat" (
  "id" SERIAL NOT NULL,
  "usuario_id" INTEGER,
  "modelo_anterior_id" TEXT,
  "modelo_nuevo_id" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auditoria_modelo_chat_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auditoria_modelo_chat_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "auditoria_modelo_chat_fecha_idx" ON "auditoria_modelo_chat" ("fecha");

ALTER TABLE "consultas" ADD COLUMN IF NOT EXISTS "modelo" TEXT;

INSERT INTO "modelo_chat" ("id", "proveedor", "modelo_api", "nombre_visible", "parametros", "precios", "habilitado", "es_por_defecto") VALUES
  ('gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o mini', '{"temperature":0.3,"maxTokens":1500,"timeoutMs":8000,"reintentos":1}'::jsonb, '{"entrada":0.15,"entradaNoCacheada":0.15,"entradaCacheada":0.075,"salida":0.6,"unidad":"USD por millón de tokens","fecha":"2026-11-17","fuente":"https://developers.openai.com/api/docs/pricing"}'::jsonb, true, true),
  ('gpt-6-luna', 'openai', 'gpt-6-luna', 'GPT-6 Luna', '{"temperature":0.3,"reasoningEffort":"none","maxTokens":1500,"timeoutMs":8000,"reintentos":1}'::jsonb, '{"entrada":0.1,"entradaNoCacheada":0.125,"entradaCacheada":0.01,"salida":0.5,"unidad":"USD por millón de tokens","fecha":"2026-11-17","fuente":"https://developers.openai.com/api/docs/models/gpt-6-luna"}'::jsonb, false, false),
  ('claude-haiku-5-5', 'anthropic', 'claude-haiku-5-5', 'Claude Haiku 5.5', '{"thinking":"disabled","effort":"low","maxTokens":1500,"timeoutMs":8000,"reintentos":1}'::jsonb, '{"entrada":0.1,"entradaNoCacheada":0.1,"entradaCacheada":0.01,"salida":0.5,"unidad":"USD por millón de tokens, prompts de hasta 100.000 tokens","fecha":"2026-11-17","fuente":"https://platform.claude.com/docs/en/about-claude/pricing"}'::jsonb, false, false),
  ('gemini-3.1-flash-lite', 'google', 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite', '{"temperature":0.3,"thinkingLevel":"minimal","maxTokens":1500,"timeoutMs":8000,"reintentos":1}'::jsonb, '{"entrada":0.25,"entradaNoCacheada":0.25,"entradaCacheada":0.025,"salida":1.5,"unidad":"USD por millón de tokens (la salida incluye el pensamiento)","fecha":"2026-11-17","fuente":"https://aistudio.google.com/docs/pricing"}'::jsonb, false, false)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "configuracion_chat" ("id", "modelo_activo_id") VALUES (1, 'gpt-4o-mini') ON CONFLICT ("id") DO NOTHING;
