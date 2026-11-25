import { z } from 'zod';
import { fechaIso, entero } from './consulta.validator.js';

const MSJ_SECTOR = 'El sectorId debe ser un entero positivo.';
const MSJ_TRAMITE = 'El tramiteId debe ser un entero positivo.';

export const sectorIdSchema = z.object({
  sectorId: entero(MSJ_SECTOR).positive(MSJ_SECTOR).optional(),
});

export const filtroMetricasSchema = z.object({
  desde: fechaIso.optional(),
  hasta: fechaIso.optional(),
  tramiteId: entero(MSJ_TRAMITE).positive(MSJ_TRAMITE).optional(),
});
