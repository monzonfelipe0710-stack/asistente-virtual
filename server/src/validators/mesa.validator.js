import { z } from 'zod';

export const crearMesaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  horario: z.string().optional(),
  esGeneral: z.boolean().optional().default(false),
  sectorId: z.number().int().positive().nullable().optional(),
});

export const actualizarMesaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  horario: z.string().optional(),
  esGeneral: z.boolean().optional(),
  sectorId: z.number().int().positive().nullable().optional(),
});
