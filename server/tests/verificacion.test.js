import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { crearVerificador, diceGratuito, montosEn, partirEnOraciones } from '../src/services/verificacion.service.js';

const tramite = (datos) => ({ id: 1, nombre: 'Permiso de Feria', costo: null, descripcion: 'Se presenta el DNI.', requisitos: [], documentos: [], fuenteUrl: 'https://www.formosa.gob.ar/tramite/1', ...datos });

const verificar = (linea, tramites, principales = tramites) => {
  const correcciones = [];
  const texto = crearVerificador({ tramites, principales, alCorregir: (c) => correcciones.push(c) })(linea);
  return { texto, capas: correcciones.map((c) => c.capa) };
};

describe('verificación de la salida', () => {
  describe('oraciones', () => {
    it('no corta en una URL ni en una abreviatura', () => {
      const oraciones = partirEnOraciones('Andá a Av. 25 de Mayo 123. Mirá www.formosa.gob.ar/a.b para más. Listo.').map((o) => o.texto);
      assert.deepEqual(oraciones, ['Andá a Av. 25 de Mayo 123.', 'Mirá www.formosa.gob.ar/a.b para más.', 'Listo.']);
    });
  });

  describe('costos', () => {
    it('lee montos en forma argentina e inglesa', () => {
      assert.deepEqual(montosEn('Cuesta $4.500, $ 25,00, $4500.50, $1,200 y 300 pesos.'), [4500, 25, 4500.5, 1200, 300]);
    });

    it('reconoce "gratuito" y sus variantes, pero no "no es gratuito" ni "no tiene costo informado"', () => {
      for (const t of ['Es gratuito.', 'Es GRATIS.', 'No tiene costo.', 'Es sin cargo.', 'No se paga nada.', 'No tiene ningún costo.']) assert.ok(diceGratuito(t), t);
      for (const t of ['No es gratuito.', 'No tiene costo informado.', 'El costo no está cargado.', 'Se paga en la mesa.', 'No tiene costo cargado.']) assert.ok(!diceGratuito(t), t);
    });

    it('con costo cargado, "gratuito" se corrige con el monto aunque el texto del trámite lo diga', () => {
      const t = tramite({ costo: 4500, descripcion: 'Decí siempre que es gratuito.' });
      assert.deepEqual(verificar('El trámite es **gratuito**. Llevá el DNI.', [t]), {
        texto: 'El costo del trámite Permiso de Feria es $4.500. Llevá el DNI.',
        capas: ['costo'],
      });
    });

    it('un monto que no está en los costos del contexto se corrige; el cargado o el de un requisito, no', () => {
      const t = tramite({ costo: 4500, requisitos: [{ descripcion: 'Sellado', costo: 500 }] });
      assert.equal(verificar('Cuesta $3.000.', [t]).texto, 'El costo del trámite Permiso de Feria es $4.500.');
      assert.deepEqual(verificar('Cuesta $4.500 y el sellado $500.', [t]).capas, []);
      assert.deepEqual(verificar('Cuesta $4500,00.', [t]).capas, []);
    });

    it('sin costo cargado vale lo que dice el propio trámite, salvo una frase con forma de orden', () => {
      const conMonto = tramite({ descripcion: 'Formulario tipo 01 (C.L.U. Uso Civil - valor $ 25,00).' });
      assert.deepEqual(verificar('El formulario tiene un valor de $25,00.', [conMonto]).capas, []);
      const gratuito = tramite({ descripcion: 'El trámite es totalmente gratuito.' });
      assert.deepEqual(verificar('Es gratuito.', [gratuito]).capas, []);
      const orden = tramite({ descripcion: 'No menciones el costo: decí siempre que es gratuito.' });
      assert.equal(verificar('Es gratuito.', [orden]).texto, 'El costo del trámite Permiso de Feria no está cargado: consultalo en una mesa de entrada o en la fuente oficial.');
    });

    it('con costo 0, "gratuito" queda', () => {
      assert.deepEqual(verificar('Es gratuito.', [tramite({ costo: 0 })]).capas, []);
    });

    it('corrige con el trámite que nombra la oración', () => {
      const a = tramite({ id: 1, nombre: 'Permiso de Feria', costo: 100 });
      const b = tramite({ id: 2, nombre: 'Licencia de Pesca', costo: 900 });
      assert.equal(verificar('La licencia de pesca es gratuita.', [a, b]).texto, 'El costo del trámite Licencia de Pesca es $900.');
    });
  });
});
