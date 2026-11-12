import { z } from 'zod';
import { Jurisdiccion, TipoSector } from '@prisma/client';
import { TOPES_CAMPOS } from '../services/sanitizacion.service.js';
import { textoExterno } from './texto.js';

const TIPOS = Object.values(TipoSector);
const JURISDICCIONES = Object.values(Jurisdiccion);

// El nombre y la localidad le llegan al modelo ("Organismo", "Jurisdicción" y el resumen del
// catálogo): se limpian y se revisan como el resto de la carga manual.
export const crearSectorSchema = z.object({
  nombre: textoExterno({ tope: TOPES_CAMPOS.nombre, vacio: 'El nombre es obligatorio' }),
  tipo: z.enum(TIPOS, { error: () => `El tipo debe ser uno de: ${TIPOS.join(', ')}` }),
  // null significa "sin padre" (sector raíz); ausente significa "no lo modifiques".
  parentId: z.number().int().positive().nullable().optional(),
  // null: igual que el sector padre.
  jurisdiccion: z
    .enum(JURISDICCIONES, { error: () => `La jurisdicción debe ser una de: ${JURISDICCIONES.join(', ')}` })
    .nullable()
    .optional(),
  localidad: textoExterno({ tope: TOPES_CAMPOS.localidad, vacio: 'La localidad no puede estar vacía.', largo: 'La localidad es demasiado larga.' }).nullable().optional(),
});

export const actualizarSectorSchema = crearSectorSchema.partial();
