import { z } from 'zod';

// Trim y minúsculas antes de validar: el mismo correo escrito distinto no puede
// crear dos cuentas ni fallar en el login.
export const emailNormalizado = (mensaje) =>
  z.string(mensaje).trim().toLowerCase().pipe(z.email(mensaje));

export const loginSchema = z
  .object({
    email: emailNormalizado('El email no es válido.').optional(),
    dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.').optional(),
    password: z.string().min(1, 'La contraseña es obligatoria.'),
  })
  .refine((d) => (d.email === undefined) !== (d.dni === undefined), {
    message: 'Ingresá el email o el DNI, uno de los dos.',
  });

export const recuperarSchema = z.object({
  email: emailNormalizado('El email no es válido.'),
});

export const restablecerSchema = z.object({
  token: z.string().min(1, 'Falta el token.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es obligatoria.'),
  passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
});
