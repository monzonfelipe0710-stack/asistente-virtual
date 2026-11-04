import { z } from 'zod';

export const calificarSchema = z.object({
  calificacion: z.literal([0, 1], 'La calificación debe ser 0 (no útil) o 1 (útil).'),
  motivo: z.string().trim().max(300, 'El motivo no puede superar los 300 caracteres.').nullable().optional(),
  token: z.string().optional(),
});
