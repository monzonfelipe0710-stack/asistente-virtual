import { z } from 'zod';
import { TOPES_CAMPOS } from '../services/sanitizacion.service.js';
import { textoExterno } from './texto.js';

export const esUrlHttp = (valor) => {
  try {
    const url = new URL(valor);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
};

const nombre = textoExterno({ tope: TOPES_CAMPOS.documento, vacio: 'El nombre no puede estar vacío.', largo: 'El nombre es demasiado largo.' });

const urlExterna = z
  .string()
  .trim()
  .max(2000, 'La URL es demasiado larga.')
  .refine(esUrlHttp, 'La URL tiene que ser http:// o https://.');

// El archivo llega aparte (multer). En el alta, sin `nombre` se usa el nombre original del
// archivo; un enlace lo exige.
export const subirDocumentoSchema = z.object({
  nombre: nombre.optional(),
  urlExterna: urlExterna.optional(),
});

export const actualizarDocumentoSchema = z.object({
  nombre: nombre.optional(),
  urlExterna: urlExterna.optional(),
});
