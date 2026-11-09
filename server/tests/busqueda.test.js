import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { PROPORCION_DEL_PRIMERO, soloLosCercanos } from '../src/services/busqueda.service.js';

const grupo = (id, mejor) => ({ id, mejor });

describe('soloLosCercanos', () => {
  it('saca los candidatos con un puntaje mucho menor que el primero', () => {
    // "licencia de conducir" (09-11-2026): la nacional, la solicitud de licencias y la de taxis.
    assert.deepEqual(soloLosCercanos([grupo(1879, 0.3436), grupo(207, 0.3052), grupo(1882, 0.2818)]).map((g) => g.id), [1879, 207]);
  });

  it('deja las opciones de una aclaración legítima', () => {
    // "cómo saco la licencia de pesca": turística, comercial y deportiva (89 % del primero).
    assert.equal(soloLosCercanos([grupo(88, 1), grupo(87, 0.9), grupo(166, 0.89)]).length, 3);
  });

  it('el límite es la proporción del primero, incluida', () => {
    assert.equal(soloLosCercanos([grupo(1, 1), grupo(2, PROPORCION_DEL_PRIMERO)]).length, 2);
    assert.deepEqual(soloLosCercanos([]), []);
  });
});
