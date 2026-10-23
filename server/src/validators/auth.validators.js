import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('El email no es válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export const recuperarSchema = z.object({
  email: z.email('El email no es válido.'),
});

export const restablecerSchema = z.object({
  token: z.string().min(1, 'Falta el token.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es obligatoria.'),
  passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
});