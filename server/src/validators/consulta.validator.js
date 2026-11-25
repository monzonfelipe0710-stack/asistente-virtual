import { z } from 'zod';

// Los que ofrece el front al calificar "no útil". Cualquier otro texto cuenta como "Otro motivo".
export const MOTIVOS_PREDEFINIDOS = [
  'No respondió mi pregunta',
  'La información no es correcta',
  'La respuesta fue confusa',
  'No era lo que buscaba',
];
export const OTRO_MOTIVO = 'Otro motivo';

const fechaIso = z.union([z.iso.date(), z.iso.datetime({ offset: true })], 'Las fechas deben estar en formato ISO (2026-11-04 o 2026-11-04T10:00:00Z).');

const entero = (mensaje) => z.coerce.number(mensaje).int(mensaje);
const MSJ_TRAMITE = 'El tramiteId debe ser un entero positivo.';
const MSJ_PAGINA = 'La página debe ser un entero mayor o igual a 1.';
const MSJ_LIMITE = 'El límite debe ser un entero entre 1 y 50.';

export const filtroCalificacionesSchema = z.object({
  desde: fechaIso.optional(),
  hasta: fechaIso.optional(),
  tramiteId: entero(MSJ_TRAMITE).positive(MSJ_TRAMITE).optional(),
  calificacion: z.enum(['0', '1'], 'La calificación debe ser 0 o 1.').transform(Number).optional(),
  page: entero(MSJ_PAGINA).min(1, MSJ_PAGINA).default(1),
  limit: entero(MSJ_LIMITE).min(1, MSJ_LIMITE).max(50, MSJ_LIMITE).default(20),
});

export const calificarSchema = z.object({
  calificacion: z.literal([0, 1], 'La calificación debe ser 0 (no útil) o 1 (útil).'),
  motivo: z.string().trim().max(300, 'El motivo no puede superar los 300 caracteres.').nullable().optional(),
  token: z.string().optional(),
});
