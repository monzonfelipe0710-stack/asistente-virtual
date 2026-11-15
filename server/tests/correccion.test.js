import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { corregirPalabra, crearVocabulario, distancia, textoLexico } from '../src/utils/correccion.js';

const vocabulario = crearVocabulario([
  'Pasaporte', 'Pasaporte "Express"', 'Requisitos para obtener la Licencia Nacional de Conducir',
  'Solicitud Partida de Nacimiento, Matrimonio o Defunción', 'Licencia por maternidad',
  'Licencia para Pesca Deportiva / Recreativa', 'Solicitud de Certificado de Buena Conducta', 'Aumento de Capital Social',
]);

describe('corrección de errores de tipeo para la búsqueda léxica', () => {
  it('distancia con transposiciones', () => {
    assert.equal(distancia('pasaporet', 'pasaporte'), 1);
    assert.equal(distancia('psporte', 'pasaporte'), 2);
    assert.equal(distancia('nacimento', 'nacimiento'), 1);
    assert.equal(distancia('abc', 'abcdef', 1), 2, 'corta apenas pasa el tope');
  });

  it('corrige faltantes, intercambios y letras que suenan igual', () => {
    assert.deepEqual(corregirPalabra('psporte', vocabulario), ['pasaporte']);
    assert.deepEqual(corregirPalabra('pasaporet', vocabulario), ['pasaporte']);
    assert.deepEqual(corregirPalabra('licensia', vocabulario), ['licencia']);
    assert.deepEqual(corregirPalabra('sertificado', vocabulario), ['certificado']);
    assert.deepEqual(corregirPalabra('deprotiva', vocabulario), ['deportiva']);
  });

  it('no toca palabras cortas, comunes, que ya están, ni lejanas', () => {
    for (const p of ['dni', 'pase', 'necesito', 'cuanto', 'pasaporte', 'fransia', 'milanesa', 'renuevo']) {
      assert.deepEqual(corregirPalabra(p, vocabulario), [], p);
    }
    assert.deepEqual(corregirPalabra('pasapor', vocabulario), ['pasaporte'], '7 letras: hasta 2');
    assert.deepEqual(corregirPalabra('psca', vocabulario), [], '4 letras: no se corrige');
    assert.deepEqual(corregirPalabra('pecsas', vocabulario), [], '6 letras: solo 1 edición');
  });

  it('el texto léxico agrega las correcciones y conserva el original', () => {
    assert.equal(textoLexico('hola, nscito renovar el psporte', vocabulario), 'hola, nscito renovar el psporte pasaporte');
    assert.equal(textoLexico('renovar el pasaporte', vocabulario), 'renovar el pasaporte');
    assert.equal(textoLexico('capital de fransia', vocabulario), 'capital de fransia');
  });
});
