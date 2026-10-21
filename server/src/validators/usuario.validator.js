import { z } from 'zod';

export const filtroUsuariosSchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO'], {
      error: () => 'El estado debe ser PENDIENTE, APROBADO, RECHAZADO o SUSPENDIDO.',
    })
    .optional(),
});

export const asignarSectoresSchema = z.object ({
  sectorIds: z.array(z.number().int().positive()),
});

export const registroCiudadanoSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.'),
  genero: z.enum(['M', 'F', 'O', 'X'], { error: () => 'El género debe ser M, F, O o X.' }),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
});