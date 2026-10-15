import { z } from 'zod';

const cuilValido = (valor) => {
  if (!/^\d{11}$/.test(valor)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((total, peso, indice) => total + Number(valor[indice]) * peso, 0);
  const digito = 11 - (suma % 11);
  const esperados = digito === 11 ? [0] : digito === 10 ? [4, 9] : [digito];
  return esperados.includes(Number(valor[10]));
};

export const registroSchema = z.object ({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  cuil: z.string()
    .transform((valor) => valor.replace(/\D/g, ''))
    .refine(cuilValido, 'El CUIL no es válido.'),
})

export const filtroUsuariosSchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'SUSPENDIDO'], {
      error: () => 'El estado debe ser PENDIENTE, APROBADO, RECHAZADO o SUSPENDIDO.',
    })
    .optional(),
});
