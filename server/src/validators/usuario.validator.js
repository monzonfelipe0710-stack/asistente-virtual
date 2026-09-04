import { z } from 'zod';

export const registroSchema = z.object ({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.')
})