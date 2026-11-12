import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { crearLimpiador, limpiarCuerpo } from '../src/utils/cuerpo.js';

// Lo que sale del limpiador si el texto llega partido en pedazos de `largo` caracteres.
const enPedazos = (texto, largo, opciones) => {
  const limpiador = crearLimpiador(opciones);
  let salida = '';
  for (let i = 0; i < texto.length; i += largo) salida += limpiador.agregar(texto.slice(i, i + largo));
  return salida + limpiador.cerrar();
};

describe('limpiarCuerpo', () => {
  it('saca los enlaces y descarta las líneas que quedan vacías', () => {
    const texto = 'Se hace en la oficina.\n\n[Ver el trámite en la fuente oficial](http://x.gob.ar/1)\n';
    assert.equal(limpiarCuerpo(texto), 'Se hace en la oficina.');
    assert.equal(limpiarCuerpo('Uno.\n[x](http://a.ar)\nDos.'), 'Uno.\nDos.');
  });

  it('deja como mucho una línea en blanco entre párrafos y recorta los bordes', () => {
    assert.equal(limpiarCuerpo('\n  Uno.  \n\n\n\nDos.\n- tres  \n\n'), 'Uno.\n\nDos.\n- tres');
  });

  it('saca el saludo repetido de la primera línea con texto', () => {
    assert.equal(limpiarCuerpo('¡Hola! Así se hace.', { saludo: 'Hola' }), 'Así se hace.');
    assert.equal(limpiarCuerpo('¡Hola!\n\nAsí se hace.', { saludo: 'Hola' }), 'Así se hace.');
    assert.equal(limpiarCuerpo('Así se hace.\n¡Hola!', { saludo: 'Hola' }), 'Así se hace.\n¡Hola!');
  });

  it('da lo mismo aunque el texto llegue partido en pedazos', () => {
    const texto =
      '¡Hola! Para renovarlo andá a la oficina: [acá](https://inventado.ar/x).\n\n' +
      '- Requisito uno\n- Requisito dos https://otro.ar/y\n\n\nCosto: no informado.\n';
    const entero = limpiarCuerpo(texto, { saludo: 'Hola' });
    assert.equal(entero, 'Para renovarlo andá a la oficina.\n\n- Requisito uno\n- Requisito dos\n\nCosto: no informado.');
    for (const largo of [1, 2, 3, 7, 13]) assert.equal(enPedazos(texto, largo, { saludo: 'Hola' }), entero, `pedazos de ${largo}`);
  });

  it('no emite una línea hasta que está completa', () => {
    const limpiador = crearLimpiador();
    assert.equal(limpiador.agregar('Mirá [el enlace](http://x'), '');
    assert.equal(limpiador.agregar('.ar) y seguí.\nOtra'), 'Mirá y seguí.');
    assert.equal(limpiador.cerrar(), '\nOtra');
  });
});

describe('listas', () => {
  const sacaItemsConEnlace = (linea) => (/^\s*- .*www\./.test(linea) ? '' : linea);
  const FRASE = 'No puedo mostrar el listado completo. Consultá en el Registro Civil de la provincia que corresponda o en la fuente oficial.';
  const enTodoTamano = (texto, opciones, esperado) => {
    for (const largo of [texto.length, 7, 1]) assert.equal(enPedazos(texto, largo, opciones), esperado, `pedazos de ${largo}`);
    assert.equal(limpiarCuerpo(texto, opciones), esperado);
  };

  it('si se pierde un ítem, la lista entera y su encabezado se reemplazan por la frase fija', () => {
    const texto = 'Ingresá a las siguientes direcciones:\n- Catamarca: portal.catamarca.gob.ar\n- Buenos Aires: www.gba.gob.ar\n- Chaco: mapadelestado.chaco.gob.ar\n\nLa solicitud es personal.';
    enTodoTamano(texto, { verificar: sacaItemsConEnlace }, `${FRASE}\n\nLa solicitud es personal.`);
  });

  it('con numeración también, y la frase sale una sola vez aunque haya dos listas', () => {
    const texto = '1. Uno www.x\n2. Dos\nTexto.\n- Tres www.y\n- Cuatro';
    enTodoTamano(texto, { verificar: (l) => (/www\./.test(l) ? '' : l) }, `${FRASE}\nTexto.`);
  });

  it('una lista que sobrevive entera, con su encabezado, no se toca', () => {
    const texto = 'Requisitos:\n- DNI vigente\n- Partida de nacimiento\n\nLlevá todo.';
    enTodoTamano(texto, { verificar: sacaItemsConEnlace }, texto);
  });

  it('un ítem que queda sin contenido útil cuenta como perdido', () => {
    enTodoTamano('Provincias:\n- Chaco: mapadelestado.chaco.gob.ar\n- **San Luis**: (más información en la fuente oficial).', {}, FRASE);
    enTodoTamano('- Buenos Aires:\n- Chaco: web', {}, FRASE);
  });

  it('un encabezado sin lista, o con texto normal debajo, queda', () => {
    enTodoTamano('Requisitos:\nEl DNI vigente.', { verificar: sacaItemsConEnlace }, 'Requisitos:\nEl DNI vigente.');
    enTodoTamano('Te cuento:', { verificar: sacaItemsConEnlace }, 'Te cuento:');
  });

  it('el saludo inicial se saca de una línea, no de un ítem', () => {
    enTodoTamano('¡Hola! Te cuento:\n- uno\n- dos', { saludo: 'Hola' }, 'Te cuento:\n- uno\n- dos');
  });
});
