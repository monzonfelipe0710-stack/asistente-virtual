import { z } from 'zod';
import { buscarInstruccion, sanitizarTexto } from '../services/sanitizacion.service.js';

// Texto de la carga manual que se guarda y le llega al modelo: se limpia como el del importador,
// el largo se mide ya limpio y una frase con forma de instrucción para el asistente se rechaza.
export const textoExterno = ({ tope, multilinea = false, vacio, largo }) => {
  const limpio = z.string().max(tope, largo ?? `El texto no puede superar los ${tope} caracteres.`);
  return z
    .string()
    .transform((valor) => sanitizarTexto(valor, { multilinea }))
    .pipe(vacio ? limpio.min(1, vacio) : limpio)
    .superRefine((valor, ctx) => {
      const hallazgo = buscarInstruccion(valor);
      if (hallazgo) {
        ctx.addIssue({
          code: 'custom',
          message: `El texto tiene una frase con forma de instrucción para el asistente ("${hallazgo.frase}"). Reescribila: el contenido de un trámite son datos para el ciudadano.`,
        });
      }
    });
};
