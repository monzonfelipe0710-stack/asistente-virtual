import { z } from 'zod';
import { EstadoUsuario, Genero } from '@prisma/client';

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

export const registroCiudadanoSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos.'),
  genero: z.enum(GENEROS, { error: () => `El género debe ser uno de: ${GENEROS.join(', ')}` }),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const crearEmpleadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.email('El email no es válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  sectorIds: z.array(z.number().int().positive()).optional().default([]),
});