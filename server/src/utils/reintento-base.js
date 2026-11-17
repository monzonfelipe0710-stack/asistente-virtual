import { enteroDeEntorno } from '../config/ia.js';
import { conSenal, msRestantes } from './plazo.js';

// Neon tarda en despertar o hay un corte de red breve: Prisma tira uno de estos códigos y la misma
// consulta, un momento después, anda. Prisma lo pone en `code` (consulta) o en `errorCode` (al
// conectar, PrismaClientInitializationError).
//   P1001 no se pudo llegar al servidor   P1002 se llegó pero no contestó a tiempo
//   P1008 la operación superó su tiempo    P1017 el servidor cerró la conexión
export const CODIGOS_TRANSITORIOS = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

// Una escritura que no es idempotente (crear la consulta con su token) solo se reintenta si es
// seguro que no llegó a la base: con P1001 no hubo conexión. Con P1002, P1008 o P1017 pudo haberse
// guardado y el reintento la duplicaría.
const SIN_EJECUTAR = new Set(['P1001']);

export const ESPERA_REINTENTO_BASE_MS = enteroDeEntorno('BASE_ESPERA_REINTENTO_MS', 1500, 0);
// Lo que tiene que quedar del plazo, después de la espera, para que valga la pena reintentar.
export const MARGEN_REINTENTO_BASE_MS = enteroDeEntorno('BASE_MARGEN_REINTENTO_MS', 1000, 0);

export const codigoTransitorio = (err) => {
  const codigo = err?.code ?? err?.errorCode;
  return CODIGOS_TRANSITORIOS.has(codigo) ? codigo : null;
};

const esperar = (ms, signal) =>
  new Promise((resolver, rechazar) => {
    if (signal?.aborted) return rechazar(signal.reason);
    const alAbortar = () => {
      clearTimeout(temporizador);
      rechazar(signal.reason);
    };
    const temporizador = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar);
      resolver();
    }, ms);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });

// Corre `operacion` (una función que devuelve la promesa de Prisma) y, si falla con un error de
// conexión transitorio, espera y la corre UNA vez más. Cualquier otro error pasa directo. Con un
// plazo de crearPlazoConVencimiento, si no queda tiempo para esperar y reintentar, falla directo.
// El log lleva solo el código: el mensaje de Prisma trae el host de la base.
export const conReintentoBase = async (operacion, { signal, escritura = false, espera = ESPERA_REINTENTO_BASE_MS, margen = MARGEN_REINTENTO_BASE_MS, etiqueta = 'consulta' } = {}) => {
  try {
    return await conSenal(operacion(), signal);
  } catch (err) {
    const codigo = codigoTransitorio(err);
    if (codigo === null || signal?.aborted) throw err;
    if (escritura && !SIN_EJECUTAR.has(codigo)) throw err;
    const restante = msRestantes(signal);
    if (restante !== null && restante < espera + margen) {
      console.warn(`Base: ${etiqueta} falló (${codigo}) y no queda plazo para reintentar (${restante} ms)`);
      throw err;
    }
    console.warn(`Base: ${etiqueta} falló (${codigo}), se reintenta una vez en ${espera} ms`);
    await esperar(espera, signal);
    return conSenal(operacion(), signal);
  }
};
