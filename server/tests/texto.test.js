import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { cortarEnOracion, finDeUltimaOracion, recortarEnOracion } from '../src/utils/texto.js';

describe('finDeUltimaOracion', () => {
  it('encuentra el último punto, signo o salto de línea dentro del límite', () => {
    assert.equal(finDeUltimaOracion('Una. Dos. Tres'), 9);
    assert.equal(finDeUltimaOracion('¿Una? Dos'), 5);
    assert.equal(finDeUltimaOracion('Una\nDos'), 4);
    assert.equal(finDeUltimaOracion('Una. Dos. Tres.', 8), 4);
  });

  it('sin fin de oración devuelve 0', () => {
    assert.equal(finDeUltimaOracion('sin cierre'), 0);
    assert.equal(finDeUltimaOracion(''), 0);
  });
});

describe('cortarEnOracion', () => {
  it('no toca un texto que entra en el tope', () => {
    assert.equal(cortarEnOracion('Hola. Chau.', 11), 'Hola. Chau.');
  });

  it('corta en la última oración completa que entra', () => {
    assert.equal(cortarEnOracion('Primera oración. Segunda oración. Tercera', 36), 'Primera oración. Segunda oración.');
    assert.equal(cortarEnOracion('Primera.\nSegunda que no entra', 15), 'Primera.');
  });

  it('sin ninguna oración completa corta en la última palabra con "…"', () => {
    const r = cortarEnOracion('una frase larga sin ningún punto', 20);
    assert.equal(r, 'una frase larga sin…');
    assert.ok(r.length <= 20);
  });
});

describe('recortarEnOracion', () => {
  it('no toca un texto que entra en el tope', () => {
    assert.equal(recortarEnOracion('Hola. Chau.', 11), 'Hola. Chau.');
  });

  it('corta en el último fin de oración y agrega "…"', () => {
    assert.equal(recortarEnOracion('Primera oración. Segunda oración. Tercera', 36), 'Primera oración. Segunda oración.…');
  });

  it('no corta en el punto de un número', () => {
    assert.equal(recortarEnOracion('Una oración larga. Cuesta $1.500 por mes', 30), 'Una oración larga.…');
  });

  it('si la última oración deja menos de la mitad del tope, corta en la última palabra', () => {
    assert.equal(recortarEnOracion('Corta. y después un texto largo sin ningún punto', 30), 'Corta. y después un texto…');
  });
});
