import { z } from 'zod';
import { Jurisdiccion, TipoSector } from '@prisma/client';

const TIPOS = Object.values(TipoSector);
const JURISDICCIONES = Object.values(Jurisdiccion);

export const crearSectorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(TIPOS, { error: () => `El tipo debe ser uno de: ${TIPOS.join(', ')}` }),
  // null significa "sin padre" (sector raíz); ausente significa "no lo modifiques".
  parentId: z.number().int().positive().nullable().optional(),
  // null: igual que el sector padre.
  jurisdiccion: z
    .enum(JURISDICCIONES, { error: () => `La jurisdicción debe ser una de: ${JURISDICCIONES.join(', ')}` })
    .nullable()
    .optional(),
  localidad: z.string().trim().min(1, 'La localidad no puede estar vacía.').max(120, 'La localidad es demasiado larga.').nullable().optional(),
});

export const actualizarSectorSchema = crearSectorSchema.partial();
