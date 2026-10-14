import { z } from 'zod';

const requisitoSchema = z.object({
  descripcion: z.string().min(1, 'La descripcion del requisito es obligatoria.'),
  dondeSeConsigue: z.string().optional(),
  costo: z.number().nonnegative().optional(),
});

export const crearTramiteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().min(1, 'La descripcion es obligatoria.'),
  costo: z.number().nonnegative().optional(),
  sectorId: z.number().int().positive('El sector es obligatorio.'),
  requisitos: z.array(requisitoSchema).optional().default([]),
  mesaId: z.array(z.number().int().positive()).optional().default([]),
});

export const actualizarTramiteSchema = crearTramiteSchema.partial();