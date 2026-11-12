// Para los scripts que llaman a OpenAI: sin crédito, todo lo que siga sale con error y contamina el
// resultado. Se corta la corrida en el momento, con un mensaje claro.
import { esSinCredito } from '../../src/core/ai/errores.js';

export const MENSAJE_SIN_CREDITO =
  'La cuenta de OpenAI no tiene crédito (429 insufficient_quota / credit_balance_exhausted): se cortó la corrida. Lo hecho hasta acá no vale como resultado.';
export const SALIDA_SIN_CREDITO = 2;

export class CorridaSinCredito extends Error {
  constructor(causa) {
    super(MENSAJE_SIN_CREDITO, { cause: causa });
    this.name = 'CorridaSinCredito';
  }
}

// Relanza como CorridaSinCredito si el error es por falta de crédito; si no, no hace nada.
export const cortarSiSinCredito = (err) => {
  if (err instanceof CorridaSinCredito) throw err;
  if (esSinCredito(err)) throw new CorridaSinCredito(err);
};
