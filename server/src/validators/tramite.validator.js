import { z } from 'zod';
import { TOPES_CAMPOS } from '../services/sanitizacion.service.js';
import { textoExterno } from './texto.js';

const requisitoSchema = z.object({
  descripcion: textoExterno({ tope: TOPES_CAMPOS.requisito, multilinea: true, vacio: 'La descripción del requisito es obligatoria.' }),
  dondeSeConsigue: textoExterno({ tope: TOPES_CAMPOS.dondeSeConsigue }).optional(),
  costo: z.number().nonnegative().optional(),
});

const tramiteSchema = z.object({
  nombre: textoExterno({ tope: TOPES_CAMPOS.nombre, vacio: 'El nombre es obligatorio.' }),
  descripcion: textoExterno({ tope: TOPES_CAMPOS.descripcion, multilinea: true, vacio: 'La descripción es obligatoria.' }),
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
