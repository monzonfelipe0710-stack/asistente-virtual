import { z } from 'zod';

export const crearSectorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['MINISTERIO', 'SUBSECRETARIA', 'DEPARTAMENTO'], {
    errorMap: () => ({message: 'El tipo debe ser uno de los especificados: MINISTERIO, SUBSECRETARIA O DEPARTAMENTO'}),
    }),
  parentId: z.number().int().positive().optional(),
});

export const actualizarSectorSchema = crearSectorSchema.partial();