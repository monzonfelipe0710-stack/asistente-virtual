import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { componerSaludo, quitarSaludoRepetido, sanitizarSaludo } from '../src/utils/saludo.js';

describe('sanitizarSaludo', () => {
  it('deja pasar saludos con letras, espacios, tildes y ¿¡', () => {
    assert.equal(sanitizarSaludo('Buen día'), 'Buen día');
    assert.equal(sanitizarSaludo('Buenas tardes'), 'Buenas tardes');
    assert.equal(sanitizarSaludo('¿Qué tal'), '¿Qué tal');
  });

  it('saca los signos que agrega el servidor y pone la primera en mayúscula', () => {
    assert.equal(sanitizarSaludo('¡Hola!'), 'Hola');
    assert.equal(sanitizarSaludo('hola,'), 'Hola');
    assert.equal(sanitizarSaludo('  buen   día.  '), 'Buen día');
  });

  it('sin saludo devuelve vacío', () => {
    for (const valor of ['', '   ', null, undefined, '¡!']) assert.equal(sanitizarSaludo(valor), '');
  });

  it('un agradecimiento o una despedida no son saludo', () => {
    for (const valor of ['Gracias', '¡Muchas gracias!', 'chau', 'Adiós', 'adios', 'Hasta luego', 'Nos vemos']) {
      assert.equal(sanitizarSaludo(valor), '', valor);
    }
  });

  it('usa "Hola" si trae otros caracteres o pasa de 30', () => {
    assert.equal(sanitizarSaludo('<b>hola</b>'), 'Hola');
    assert.equal(sanitizarSaludo('Hola 123'), 'Hola');
    assert.equal(sanitizarSaludo('Hola, María'), 'Hola');
    assert.equal(sanitizarSaludo('a'.repeat(31)), 'Hola');
    assert.equal(sanitizarSaludo('a'.repeat(30)), `A${'a'.repeat(29)}`);
  });
});

describe('componerSaludo', () => {
  it('arma el saludo con o sin nombre', () => {
    assert.equal(componerSaludo('Buen día', 'María'), '¡Buen día, María! ');
    assert.equal(componerSaludo('Buen día', null), '¡Buen día! ');
    assert.equal(componerSaludo('', 'María'), '');
  });
});

describe('quitarSaludoRepetido', () => {
  it('saca el saludo si el cuerpo empieza con él', () => {
    assert.equal(quitarSaludoRepetido('¡Hola! Para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludoRepetido('hola, para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludoRepetido('¡Buen día! Te cuento.', 'Buen día'), 'Te cuento.');
  });

  it('no toca el cuerpo si no empieza con el saludo, o si es parte de una frase', () => {
    assert.equal(quitarSaludoRepetido('Para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludoRepetido('Buenas noticias: es gratis.', 'Buenas'), 'Buenas noticias: es gratis.');
    assert.equal(quitarSaludoRepetido('¡Hola! Para renovarlo...', ''), '¡Hola! Para renovarlo...');
  });
});
