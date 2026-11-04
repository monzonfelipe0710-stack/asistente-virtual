import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { coincideConPadron, primerNombre } from '../src/utils/nombres.js';

const padron = { nombre: 'MARÍA JOSÉ', apellido: 'GÓMEZ PEÑA' };

describe('coincideConPadron', () => {
  it('acepta parte de un nombre o apellido compuesto', () => {
    assert.equal(coincideConPadron({ nombre: 'María', apellido: 'Gómez' }, padron), true);
    assert.equal(coincideConPadron({ nombre: 'María José', apellido: 'Gómez Peña' }, padron), true);
  });

  it('ignora tildes y mayúsculas', () => {
    assert.equal(coincideConPadron({ nombre: 'maria jose', apellido: 'gomez pena' }, padron), true);
  });

  it('acepta las palabras en otro orden', () => {
    assert.equal(coincideConPadron({ nombre: 'José María', apellido: 'Peña Gómez' }, padron), true);
  });

  it('rechaza el apellido de otra persona', () => {
    assert.equal(coincideConPadron({ nombre: 'María', apellido: 'Fernández' }, padron), false);
  });

  it('rechaza una palabra de más que no está en el padrón', () => {
    assert.equal(coincideConPadron({ nombre: 'María Laura', apellido: 'Gómez' }, padron), false);
  });

  it('no cruza el nombre con el apellido', () => {
    assert.equal(coincideConPadron({ nombre: 'Gómez', apellido: 'María' }, padron), false);
  });

  it('rechaza lo vacío, tipeado o en el padrón', () => {
    assert.equal(coincideConPadron({ nombre: '', apellido: 'Gómez' }, padron), false);
    assert.equal(coincideConPadron({ nombre: 'María', apellido: '   ' }, padron), false);
    assert.equal(coincideConPadron({ nombre: 'María', apellido: 'Gómez' }, { nombre: '', apellido: '' }), false);
  });
});

describe('primerNombre', () => {
  it('toma la primera palabra en formato título', () => {
    assert.equal(primerNombre('MARÍA JOSÉ GÓMEZ'), 'María');
    assert.equal(primerNombre('juan pérez'), 'Juan');
    assert.equal(primerNombre('  ÑANDÚ  '), 'Ñandú');
    assert.equal(primerNombre('JUAN-PABLO ROMERO'), 'Juan-Pablo');
  });

  it('sin una palabra con letras devuelve null', () => {
    for (const valor of ['', '   ', null, undefined, '. GÓMEZ']) assert.equal(primerNombre(valor), null);
  });
});
