import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { crearVerificador, oracionesFirmes, partirEnOraciones } from '../src/services/verificacion.service.js';
import { crearLiberador, crearLimpiadorPorOraciones, limpiarPorOraciones } from '../src/services/salida.service.js';
import { limpiarCuerpo } from '../src/utils/cuerpo.js';
import { MENSAJE_FUERA_DE_ALCANCE } from '../src/services/guardrail.service.js';

const tramite = { id: 1, nombre: 'Permiso de Feria', costo: 4500, descripcion: 'Se presenta el DNI.', requisitos: [], documentos: [], fuenteUrl: 'https://www.formosa.gob.ar/tramite/1' };
const verificador = () => crearVerificador({ tramites: [tramite], principales: [tramite] });
const textos = (pedazos) => pedazos.filter((p) => p.texto).map((p) => p.texto);
const de = (texto) => ({ texto });

describe('salida de a oraciones', () => {
  describe('oracionesFirmes', () => {
    // Lo que se da por terminado en una línea a medio llegar no cambia cuando llega el resto.
    const lineas = [
      'Mirá. formosa.comunidad es otra cosa. Y listo.',
      'Mirá. formosa.com es la web. Y listo.',
      'Ver [acá. Más info](http://x.gob.ar/a.b) para todo. Después.',
      'Hola! ![img. Dos](u) Fin. Otra.',
      '[Nota] El trámite. Otra oración.',
      'Andá a Av. Gutnisky 123. Hs. 8 a 12. Cuesta $1.500. Listo.',
      'Entrá a www.formosa.gob.ar. Después llevá el DNI.',
      'Entrá a http://formosa.gob.ar/a. Después llevá el DNI.',
      '¿Cómo? ¡Así! "Cita." (Paréntesis.) **Negrita.** Fin.',
      'Texto.  Doble espacio.\tTab. Fin.',
    ];
    for (const linea of lineas) {
      it(JSON.stringify(linea), () => {
        const completas = partirEnOraciones(linea);
        for (let i = 0; i <= linea.length; i++) {
          const firmes = oracionesFirmes(linea.slice(0, i));
          assert.deepEqual(firmes, completas.slice(0, firmes.length), `con ${i} caracteres`);
          assert.ok(firmes.length < completas.length, 'la última oración nunca es firme');
        }
      });
    }

    it('un enlace markdown sin cerrar retiene el corte que hay en su texto', () => {
      assert.deepEqual(oracionesFirmes('Ver [acá. Más info](http://x').map((o) => o.texto), []);
      assert.deepEqual(oracionesFirmes('Primera. Ver [acá. Más info](http://x').map((o) => o.texto), ['Primera.']);
    });
  });

  describe('limpiador', () => {
    it('manda cada oración en cuanto llega la siguiente', () => {
      const limpiador = crearLimpiadorPorOraciones({ verificar: verificador() });
      assert.deepEqual(textos(limpiador.agregar('El trámite es personal. Se pres')), ['El trámite es personal.']);
      assert.deepEqual(textos(limpiador.agregar('enta el DNI. ')), []);
      assert.deepEqual(textos(limpiador.agregar('Cuesta $4.500.')), [' Se presenta el DNI.']);
      assert.deepEqual(textos(limpiador.cerrar()), [' Cuesta $4.500.']);
    });

    it('retiene la lista y su anuncio hasta que termina', () => {
      const limpiador = crearLimpiadorPorOraciones({ verificar: verificador() });
      assert.deepEqual(textos(limpiador.agregar('Es simple. Requisitos:\n- DNI\n')), ['Es simple.']);
      assert.deepEqual(textos(limpiador.agregar('- Foto\n')), []);
      // Una línea que ya no puede ser ítem cierra la lista.
      assert.deepEqual(textos(limpiador.agregar('\nListo.')), [' Requisitos:\n- DNI\n- Foto']);
      assert.deepEqual(textos(limpiador.cerrar()), ['\n\nListo.']);
    });

    it('da lo mismo que el limpiador por líneas en lo que no cambió', () => {
      const textos = [
        '¡Hola! Te cuento:\n\n\n- uno\n- dos\n\nSe hace en la mesa. Necesitas el DNI.',
        'Primera línea.\nSegunda línea con [enlace](http://x.example.com) adentro.\n\n\nTercera.',
        'Así se hace. Ten en cuenta que puedes pedir turno.',
      ];
      for (const texto of textos) assert.equal(limpiarPorOraciones(texto, { saludo: 'Hola' }), limpiarCuerpo(texto, { saludo: 'Hola' }));
    });
  });

  describe('liberador', () => {
    it('no manda nada hasta ver el idioma', () => {
      const liberador = crearLiberador();
      assert.deepEqual(liberador.agregar(de('Sure!')), []);
      assert.deepEqual(liberador.agregar(de(' El trámite se hace en la mesa de entradas con el DNI y la partida.')), ['Sure! El trámite se hace en la mesa de entradas con el DNI y la partida.']);
    });

    it('lo que podría ser el mensaje fijo se retiene hasta el final', () => {
      const liberador = crearLiberador();
      const [primera] = MENSAJE_FUERA_DE_ALCANCE.split(/(?<=\.) /);
      assert.deepEqual(liberador.agregar(de(primera)), []);
      assert.deepEqual(liberador.agregar(de(MENSAJE_FUERA_DE_ALCANCE.slice(primera.length))), []);
      assert.equal(liberador.cerrar().decision, 'fuera_de_alcance');
    });

    it('una conversación no sale hasta el final', () => {
      const liberador = crearLiberador({ oculto: true });
      assert.deepEqual(liberador.agregar(de('¡De nada! Cuando quieras, preguntame por otro trámite.')), []);
      assert.equal(liberador.cerrar().decision, 'retenida');
    });
  });
});

describe('idioma sobre el texto del modelo', () => {
  it('una oración reemplazada por el servidor no tapa una respuesta en portugués', () => {
    const verificar = crearVerificador({ tramites: [tramite], principales: [tramite] });
    const limpiador = crearLimpiadorPorOraciones({ verificar });
    const liberador = crearLiberador({ retenerContenido: true });
    const texto = 'Claro! Para fazer o trâmite você precisa do seu documento e de uma foto. O trâmite é gratuito e pode ser feito na prefeitura. Também é possível agendar um horário.';
    const pedazos = [...limpiador.agregar(texto), ...limpiador.cerrar()];
    assert.ok(pedazos.some((p) => p.texto.includes('El costo del trámite')), 'la verificación reemplazó el "gratuito"');
    const mandado = pedazos.flatMap((p) => liberador.agregar(p));
    assert.deepEqual(mandado, []);
    assert.equal(liberador.cerrar().decision, 'otro_idioma');
  });
});
