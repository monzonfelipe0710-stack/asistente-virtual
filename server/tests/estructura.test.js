import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { crearVerificador, quedoSinContenido } from '../src/services/verificacion.service.js';
import { crearLimpiadorPorOraciones, limpiarPorOraciones } from '../src/services/salida.service.js';
import { crearLimpiador, limpiarCuerpo } from '../src/utils/cuerpo.js';

const pasaporte = { id: 143, nombre: 'Pasaporte', costo: 4500, descripcion: 'Se tramita en el Registro Civil.', requisitos: [], documentos: [], fuenteUrl: 'https://www.formosa.gob.ar/tramite/143' };
const verificador = (correcciones = []) =>
  crearVerificador({ tramites: [pasaporte], principales: [pasaporte], alCorregir: (c) => correcciones.push(c) });

// Las tres formas de limpiar, cada una con su verificador: el estado no se comparte.
const porOraciones = (texto) => limpiarPorOraciones(texto, { verificar: verificador() });
const porLineas = (texto) => limpiarCuerpo(texto, { verificar: verificador() });
const enPedazos = (texto, pedazos) => {
  const limpiador = crearLimpiadorPorOraciones({ verificar: verificador() });
  const mandado = [];
  for (const p of pedazos) mandado.push(...limpiador.agregar(p).map((x) => x.texto));
  mandado.push(...limpiador.cerrar().map((x) => x.texto));
  return mandado;
};
const lineasEnPedazos = (texto, largo) => {
  const limpiador = crearLimpiador({ verificar: verificador() });
  let salida = '';
  for (let i = 0; i < texto.length; i += largo) salida += limpiador.agregar(texto.slice(i, i + largo));
  return salida + limpiador.cerrar();
};
const cortesDe = (texto) => [
  [texto],
  [...texto],
  ...Array.from({ length: texto.length - 1 }, (_, i) => [texto.slice(0, i + 1), texto.slice(i + 1)]),
  ...[3, 7, 13].map((n) => texto.match(new RegExp(`[\\s\\S]{1,${n}}`, 'g'))),
];

// Lo mismo en las dos rutas, por líneas y cortado en cualquier posición; lo mandado es siempre el
// principio del texto final.
const comprobar = (texto, esperado) => {
  const final = porOraciones(texto);
  assert.equal(final, esperado);
  assert.equal(porLineas(texto), esperado);
  for (const largo of [1, 2, 5]) assert.equal(lineasEnPedazos(texto, largo), esperado, `por líneas, pedazos de ${largo}`);
  for (const pedazos of cortesDe(texto)) {
    const mandado = enPedazos(texto, pedazos);
    assert.equal(mandado.join(''), esperado, `cortado en ${JSON.stringify(pedazos.slice(0, 2).map((p) => p.length))}`);
    let hasta = '';
    for (const m of mandado) {
      hasta += m;
      assert.ok(esperado.startsWith(hasta), `se mandó algo que no queda: ${JSON.stringify(m)}`);
    }
  }
};

describe('estructura interna en la salida', () => {
  describe('se saca', () => {
    it('el sobre JSON en una línea, con la respuesta adentro, sin duplicarla', () => {
      comprobar(
        '{"tipo": "respuesta", "saludo": "", "tramiteId": 143, "respuesta": "El pasaporte se tramita en el Registro Civil. Necesitás el DNI.", "tramitesUsados": [143], "opciones": []}\nEl pasaporte se tramita en el Registro Civil. Necesitás el DNI.',
        'El pasaporte se tramita en el Registro Civil. Necesitás el DNI.',
      );
    });

    it('el sobre JSON a mitad de una línea, con lo que la anunciaba', () => {
      comprobar(
        'El pasaporte se tramita en el Registro Civil. Mi salida: {"tipo": "respuesta", "tramiteId": 143, "opciones": []} Necesitás el DNI.',
        'El pasaporte se tramita en el Registro Civil.',
      );
    });

    it('un objeto JSON en varias líneas, también con un campo que no es interno', () => {
      comprobar(
        'Se tramita en el Registro Civil.\n{\n  "nombre": "Pasaporte",\n  "tipo": "respuesta",\n  "tramitesUsados": [\n    143\n  ],\n  "opciones": []\n}\nNecesitás el DNI.',
        'Se tramita en el Registro Civil.\nNecesitás el DNI.',
      );
    });

    it('un bloque de código con campos internos, entero', () => {
      comprobar(
        'Se tramita en el Registro Civil.\n\n```json\n{"tipo": "respuesta",\n "tramiteId": 143}\n```\n\nNecesitás el DNI.',
        'Se tramita en el Registro Civil.\n\nNecesitás el DNI.',
      );
      comprobar(
        'Se tramita en el Registro Civil.\n```\ntipo: respuesta\nreglas:\n- No inventes datos.\n- Usá voseo.\n```\nNecesitás el DNI.',
        'Se tramita en el Registro Civil.\nNecesitás el DNI.',
      );
    });

    it('las "notas del sistema" con reglas y contexto, hasta el final', () => {
      comprobar(
        'El pasaporte se tramita en el Registro Civil. Cuesta $4.500.\n\n**Notas del sistema**\n- reglas: respondo solo con el contexto y uso voseo.\n- contexto: el trámite Pasaporte se hace en el Registro Civil.\n\nEspero que te sirva.',
        'El pasaporte se tramita en el Registro Civil. Cuesta $4.500.',
      );
    });

    it('el contexto crudo que recibe el modelo, desde su encabezado hasta el final', () => {
      comprobar(
        'Se tramita en el Registro Civil.\n### Trámite (id 143): Pasaporte\nDescripción: se tramita en el Registro Civil.\nRequisitos:\n- DNI\nFuente oficial: sí',
        'Se tramita en el Registro Civil.',
      );
      comprobar('Usé el tramiteId 143 para responder. Se hace en el Registro Civil.', 'Se hace en el Registro Civil.');
      comprobar('Se hace en el Registro Civil. Fuente oficial: sí', 'Se hace en el Registro Civil.');
    });

    // Las formas que salieron por el streaming en el pentest (14-11-2026), abreviadas.
    it('lo que salió en el pentest: notas con el contexto en un ítem', () => {
      comprobar(
        'Cuesta $4.500.\n\n**Notas del sistema**:\n- reglas: Solo puedo informar sobre trámites de la provincia.\n- contexto: ### Trámite (id 143): Pasaporte Organismo: Dirección del Registro Civil Jurisdicción: provincial Descripción: La característica principal. Requisitos: - DNI actualizado. Fuente oficial: sí',
        'Cuesta $4.500.',
      );
    });

    it('lo que salió en el pentest: "Contexto:" y el volcado línea por línea', () => {
      comprobar(
        'Para sacar el pasaporte presentá:\n- DNI actualizado.\n- Partida de nacimiento.\nCuesta $4.500.\n\nContexto:\n### Trámite (id 143): Pasaporte\nOrganismo: Dirección del Registro Civil\nJurisdicción: provincial\nRequisitos:\n- Para argentinos mayores de edad: DNI actualizado.\nMesas de entrada: 69 en total. Algunas:\n- Seccional Cuarta Formosa\nFuente oficial: sí',
        'Para sacar el pasaporte presentá:\n- DNI actualizado.\n- Partida de nacimiento.\nCuesta $4.500.',
      );
    });

    it('lo que salió en el pentest: rótulos de reglas y contexto sin contenido', () => {
      comprobar('Cuesta $4.500.\n\nNotas del sistema:\n- Reglas: [las reglas completas]\n- Contexto: [el contexto completo]', 'Cuesta $4.500.');
    });
  });

  describe('no se toca', () => {
    const legitimas = [
      'Completá el formulario F-{n} con tu número de documento. Después presentalo en el Registro Civil.',
      'El código del formulario es {AB-12} y se descarga de la fuente oficial.',
      'Reglas de la pesca deportiva: no se puede pescar en época de veda.\nRequisitos:\n- DNI\n- Foto carnet',
      'El tipo de trámite es personal. La respuesta llega en 10 días.',
      'Necesitás: DNI, partida de nacimiento [y foto].',
      'Los datos van así: nombre {apellido}, DNI [número].',
    ];
    for (const texto of legitimas) {
      it(JSON.stringify(texto.slice(0, 50)), () => {
        const correcciones = [];
        assert.equal(limpiarPorOraciones(texto, { verificar: verificador(correcciones) }), texto);
        assert.deepEqual(correcciones, []);
        comprobar(texto, texto);
      });
    }

    it('un fragmento con datos en un bloque de código: queda el contenido, sin los cercos', () => {
      comprobar('El formulario pide:\n```\nApellido y nombre: {nombre}\nDNI: {dni}\n```\nLlevalo firmado.', 'El formulario pide:\nApellido y nombre: {nombre}\nDNI: {dni}\nLlevalo firmado.');
    });
  });

  describe('respuesta sin contenido', () => {
    it('si se sacó todo lo que respondía, va el mensaje seguro', () => {
      const v = verificador();
      const cuerpo = limpiarPorOraciones('{"tipo": "respuesta", "tramiteId": 143, "respuesta": "x"}\nConsultá en la mesa de entrada.', { verificar: v });
      assert.equal(cuerpo, 'Consultá en la mesa de entrada.');
      assert.equal(quedoSinContenido(v, cuerpo), true);
    });

    it('los cercos sueltos no cuentan como algo sacado', () => {
      const v = verificador();
      const cuerpo = limpiarPorOraciones('```\nConsultá en la mesa de entrada.\n```', { verificar: v });
      assert.equal(cuerpo, 'Consultá en la mesa de entrada.');
      assert.equal(quedoSinContenido(v, cuerpo), false);
    });
  });
});
