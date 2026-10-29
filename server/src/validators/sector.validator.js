import { z } from 'zod';
import { TipoSector } from '@prisma/client';

const TIPOS = Object.values(TipoSector);

export const crearSectorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(TIPOS, { error: () => `El tipo debe ser uno de: ${TIPOS.join(', ')}` }),
  // null significa "sin padre" (sector raíz); ausente significa "no lo modifiques".
  parentId: z.number().int().positive().nullable().optional(),
});

export const actualizarSectorSchema = crearSectorSchema.partial();
