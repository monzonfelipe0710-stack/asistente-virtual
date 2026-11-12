import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APIError } from 'openai';

import { ErrorProveedorIA, esSinCredito } from '../src/core/ai/errores.js';
import { CorridaSinCredito, cortarSiSinCredito } from '../scripts/lib/sin-credito.js';

// Como llega al script: AsistenteNoDisponibleError → ErrorProveedorIA → APIError del SDK.
const envuelto = (apiError) => {
  const proveedor = new ErrorProveedorIA('RateLimitError 429', { operacion: 'chat', original: apiError });
  return new Error('El asistente no está disponible en este momento.', { cause: proveedor });
};
const error429 = (error) => APIError.generate(429, { error }, 'falla', new Headers());

describe('sin crédito en OpenAI', () => {
  it('reconoce insufficient_quota y credit_balance_exhausted en toda la cadena de causas', () => {
    assert.equal(esSinCredito(envuelto(error429({ code: 'credit_balance_exhausted', type: 'insufficient_quota', message: 'x' }))), true);
    assert.equal(esSinCredito(envuelto(error429({ code: 'insufficient_quota', type: 'insufficient_quota', message: 'x' }))), true);
  });

  it('un 429 por límite de tasa u otro error no es falta de crédito', () => {
    assert.equal(esSinCredito(envuelto(error429({ code: 'rate_limit_exceeded', type: 'requests', message: 'x' }))), false);
    assert.equal(esSinCredito(new Error('otra cosa')), false);
    assert.equal(esSinCredito(null), false);
  });

  it('cortarSiSinCredito corta la corrida solo por falta de crédito', () => {
    assert.throws(() => cortarSiSinCredito(envuelto(error429({ code: 'insufficient_quota', message: 'x' }))), CorridaSinCredito);
    assert.doesNotThrow(() => cortarSiSinCredito(new Error('timeout')));
  });
});
