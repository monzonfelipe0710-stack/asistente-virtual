import { z } from 'zod';

// El nombre es opcional: si no viene, se usa el nombre original del archivo.
export const subirDocumentoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre no puede estar vacío.')
    .max(200, 'El nombre es demasiado largo.')
    .optional(),
});
