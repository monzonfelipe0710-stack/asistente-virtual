import { z } from 'zod';

export const registroSchema = z.object ({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.')
})

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
  genero: z.enum(['M', 'F'], { error: () => 'El género debe ser M o F.' }),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});