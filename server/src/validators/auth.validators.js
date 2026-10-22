import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('El email no es válido.').trim().toLowerCase().optional(),
  dni: z.string().regex(/^\\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.').optional(),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
}).refine(
  (datos) => Boolean(datos.email) !== Boolean(datos.dni),
  { message: 'Ingresá un email o DNI, pero no ambos.', path: ['email'] },
);

export const recuperarSchema = z.object({
  email: z.email('El email no es válido.'),
});

export const restablecerSchema = z.object({
  token: z.string().min(1, 'Falta el token.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});