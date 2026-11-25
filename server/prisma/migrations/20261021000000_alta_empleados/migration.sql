ALTER TABLE "usuarios"
  ADD COLUMN "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "password_cambiada_en" TIMESTAMP(3);