import { z } from 'zod';

const requisitoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción del requisito es obligatoria.'),
  dondeSeConsigue: z.string().optional(),
  costo: z.number().nonnegative().optional(),
});

const tramiteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().min(1, 'La descripción es obligatoria.'),
  costo: z.number().nonnegative().optional(),
  sectorId: z.number().int().positive('El sector es obligatorio.'),
  requisitos: z.array(requisitoSchema),
  mesaIds: z.array(z.number().int().positive()),
});

// Al crear, requisitos y mesas pueden omitirse y arrancan vacíos.
export const crearTramiteSchema = tramiteSchema.extend({
  requisitos: tramiteSchema.shape.requisitos.default([]),
  mesaIds: tramiteSchema.shape.mesaIds.default([]),
});

// Sin defaults a propósito: en Zod 4 un .default() se aplica aunque el campo esté
// dentro de .partial(), y el service interpreta un array presente como "reemplazar
// todo". Un PATCH que solo cambia el nombre terminaba borrando requisitos y mesas.
export const actualizarTramiteSchema = tramiteSchema.partial();
