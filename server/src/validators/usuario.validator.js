import { z } from 'zod';
import { EstadoUsuario, Genero } from '@prisma/client';
import { emailNormalizado } from './auth.validators.js';

const ESTADOS = Object.values(EstadoUsuario);
const GENEROS = Object.values(Genero);

export const filtroUsuariosSchema = z.object({
  estado: z
    .enum(ESTADOS, { error: () => `El estado debe ser uno de: ${ESTADOS.join(', ')}` })
    .optional(),
});

export const asignarSectoresSchema = z.object ({
  sectorIds: z.array(z.number().int().positive()),
});

// El padrón solo distingue M y F. Con X no hay contra qué cruzar el género, así que
// se pide el nombre y apellido para verificar la identidad; con M o F se ignoran.
export const GENEROS_PADRON = GENEROS.filter((g) => g !== 'X');

const registroBase = {
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.'),
  email: emailNormalizado('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
};

const textoObligatorio = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

export const registroCiudadanoSchema = z.discriminatedUnion(
  'genero',
  [
    z.object({ ...registroBase, genero: z.enum(GENEROS_PADRON) }),
    z.object({
      ...registroBase,
      genero: z.literal('X'),
      nombre: textoObligatorio('El nombre es obligatorio.'),
      apellido: textoObligatorio('El apellido es obligatorio.'),
    }),
  ],
  { error: (issue) => (issue.code === 'invalid_union' ? `El género debe ser uno de: ${GENEROS.join(', ')}` : undefined) },
);

export const crearEmpleadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: emailNormalizado('El email no es válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  sectorIds: z.array(z.number().int().positive()).optional().default([]),
});