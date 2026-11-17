import { z } from 'zod';

export const cambiarModeloSchema = z.object({
  modeloId: z.string('Falta el modelo.').trim().min(1, 'Falta el modelo.').max(100, 'El id del modelo no puede superar los 100 caracteres.'),
  motivo: z.string('Falta el motivo del cambio.').trim().min(5, 'El motivo tiene que tener al menos 5 caracteres.').max(500, 'El motivo no puede superar los 500 caracteres.'),
});

const MSJ_LIMITE = 'El límite debe ser un entero entre 1 y 200.';
export const auditoriaSchema = z.object({
  limite: z.coerce.number(MSJ_LIMITE).int(MSJ_LIMITE).min(1, MSJ_LIMITE).max(200, MSJ_LIMITE).default(50),
});
