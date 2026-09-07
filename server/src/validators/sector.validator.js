import { z } from 'zod';

export const crearSectorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['MINISTERIO', 'SUBSECRETARIA', 'DEPARTAMENTO'], {
    error: () => 'El tipo debe ser uno de los especificados: MINISTERIO, SUBSECRETARIA o DEPARTAMENTO',
  }),
  // null significa "sin padre" (sector raíz); ausente significa "no lo modifiques".
  parentId: z.number().int().positive().nullable().optional(),
});

export const actualizarSectorSchema = crearSectorSchema.partial();
