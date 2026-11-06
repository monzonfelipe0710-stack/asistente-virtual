import { z } from 'zod';
import { TOPES_CAMPOS } from '../services/sanitizacion.service.js';
import { textoExterno } from './texto.js';

const nombre = textoExterno({ tope: TOPES_CAMPOS.mesa, vacio: 'El nombre es obligatorio.' });
const direccion = textoExterno({ tope: TOPES_CAMPOS.mesa });
const localidad = textoExterno({ tope: TOPES_CAMPOS.localidad });
const horario = textoExterno({ tope: TOPES_CAMPOS.mesa });
const telefono = textoExterno({ tope: TOPES_CAMPOS.telefono });
const email = textoExterno({ tope: TOPES_CAMPOS.email });

export const crearMesaSchema = z.object({
  nombre,
  direccion: direccion.optional(),
  localidad: localidad.optional(),
  horario: horario.optional(),
  telefono: telefono.optional(),
  email: email.optional(),
  esGeneral: z.boolean().optional().default(false),
  sectorId: z.number().int().positive().nullable().optional(),
});

export const actualizarMesaSchema = z.object({
  nombre: nombre.optional(),
  direccion: direccion.optional(),
  localidad: localidad.optional(),
  horario: horario.optional(),
  telefono: telefono.optional(),
  email: email.optional(),
  esGeneral: z.boolean().optional(),
  sectorId: z.number().int().positive().nullable().optional(),
});
