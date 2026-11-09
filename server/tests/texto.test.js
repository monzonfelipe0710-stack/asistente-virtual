import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { cortarEnOracion, finDeUltimaOracion, juntarRenglones, recortarEnOracion } from '../src/utils/texto.js';

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

describe('juntarRenglones', () => {
  const texto = '1) Hasta 25 m 2: 3 módulos: $15.110,28\n2) Más de 25 m 2: 5,5 módulos: $27.702,18\n\n3) Más de 50 m 2: 9 módulos: $45.330,84';

  it('junta todos los renglones con "; " si entran', () => {
    assert.deepEqual(juntarRenglones(texto, 1000), {
      texto: '1) Hasta 25 m 2: 3 módulos: $15.110,28; 2) Más de 25 m 2: 5,5 módulos: $27.702,18; 3) Más de 50 m 2: 9 módulos: $45.330,84',
      faltan: 0,
    });
  });

  it('corta por renglón completo, nunca en medio de un monto, en cualquier tope', () => {
    const renglones = texto.split('\n').filter(Boolean);
    for (let tope = 0; tope <= 130; tope++) {
      const { texto: junto, faltan } = juntarRenglones(texto, tope);
      assert.ok(junto.length <= tope);
      const partes = junto ? junto.split('; ') : [];
      assert.deepEqual(partes, renglones.slice(0, partes.length), `tope ${tope}`);
      assert.equal(faltan, renglones.length - partes.length);
    }
  });

  it('si el primer renglón no entra, no devuelve nada', () => {
    assert.deepEqual(juntarRenglones('Un renglón largo: $1.500', 10), { texto: '', faltan: 1 });
  });
});
