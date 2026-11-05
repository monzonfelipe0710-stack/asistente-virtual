import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { componerSaludo, contieneSaludo, quitarSaludosIniciales, sanitizarSaludo } from '../src/utils/saludo.js';

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

describe('quitarSaludosIniciales', () => {
  it('saca el saludo si el cuerpo empieza con él', () => {
    assert.equal(quitarSaludosIniciales('¡Hola! Para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludosIniciales('hola, para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludosIniciales('¡Buen día! Te cuento.', 'Buen día'), 'Te cuento.');
  });

  it('saca hasta dos saludos o cortesías encadenados, aunque el servidor no salude', () => {
    assert.equal(quitarSaludosIniciales('¡Buenas! ¡Hola! ¿En qué trámite te ayudo?', 'Buenas'), '¿En qué trámite te ayudo?');
    assert.equal(quitarSaludosIniciales('¡Hola! Solo ayudo con trámites.'), 'Solo ayudo con trámites.');
    assert.equal(quitarSaludosIniciales('Hola, buenas tardes. Te cuento.'), 'Te cuento.');
    assert.equal(quitarSaludosIniciales('¡Buen día! ¿Qué tal? Te cuento.'), 'Te cuento.');
    assert.equal(quitarSaludosIniciales('¡Hola! ¡Hola! ¡Hola! Tres.'), '¡Hola! Tres.');
  });

  it('no toca el cuerpo si no empieza con un saludo, o si es parte de una frase', () => {
    assert.equal(quitarSaludosIniciales('Para renovarlo...', 'Hola'), 'Para renovarlo...');
    assert.equal(quitarSaludosIniciales('Buenas noticias: es gratis.', 'Buenas'), 'Buenas noticias: es gratis.');
    assert.equal(quitarSaludosIniciales('¡De nada! Cuando quieras.'), '¡De nada! Cuando quieras.');
    assert.equal(quitarSaludosIniciales('Holanda no es un trámite.'), 'Holanda no es un trámite.');
  });
});

describe('contieneSaludo', () => {
  it('reconoce los saludos de la lista en cualquier parte del mensaje, con o sin tildes', () => {
    for (const m of ['hola', 'Hola, ¿cómo saco el DNI?', 'buen día', 'BUENOS DÍAS', 'buenas', 'Buenas tardes', 'buenas noches', 'qué tal', 'que tal todo', 'saludos', 'necesito el DNI, hola']) {
      assert.equal(contieneSaludo(m), true, m);
    }
  });

  it('no confunde palabras que solo empiezan igual ni mensajes sin saludo', () => {
    for (const m of ['capital de francia', 'Holanda', 'gracias', 'chau', 'buen trámite', '', null]) {
      assert.equal(contieneSaludo(m), false, String(m));
    }
  });
});
