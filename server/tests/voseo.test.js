import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { corregirTuteo } from '../src/utils/voseo.js';
import { limpiarCuerpo } from '../src/utils/cuerpo.js';

const voseo = (texto) => corregirTuteo(texto).texto;

describe('corregirTuteo', () => {
  it('pasa a voseo cada forma de la lista', () => {
    const pares = [
      ['tienes', 'tenés'], ['puedes', 'podés'], ['debes', 'debés'], ['necesitas', 'necesitás'],
      ['quieres', 'querés'], ['sabes', 'sabés'], ['vienes', 'venís'], ['haces', 'hacés'], ['eres', 'sos'], ['recuerda', 'recordá'],
      ['asegúrate', 'asegurate'], ['acércate', 'acercate'], ['fíjate', 'fijate'], ['ten en cuenta', 'tené en cuenta'],
    ];
    for (const [tuteo, vos] of pares) assert.equal(voseo(`Si ${tuteo} algo.`), `Si ${vos} algo.`, tuteo);
  });

  it('respeta la mayúscula inicial y devuelve las formas que encontró', () => {
    assert.deepEqual(corregirTuteo('Puedes ir. Ten en cuenta que debes llevarlo.'), {
      texto: 'Podés ir. Tené en cuenta que debés llevarlo.',
      formas: ['Puedes', 'Ten en cuenta', 'debes'],
    });
  });

  it('solo cambia palabras completas y deja "tu" como está', () => {
    for (const texto of ['Los deberes y las haciendas.', 'Tenés tu DNI.', 'Los bienes.', 'Las tiendas.', 'atienes']) {
      assert.deepEqual(corregirTuteo(texto), { texto, formas: [] }, texto);
    }
  });

  it('no toca URLs ni el interior de los enlaces', () => {
    const texto = 'Si puedes, mirá [lo que necesitas](https://x.ar/puedes) o https://y.ar/tienes.';
    assert.equal(voseo(texto), 'Si podés, mirá [lo que necesitas](https://x.ar/puedes) o https://y.ar/tienes.');
  });

  it('se aplica en el limpiador del cuerpo y avisa qué corrigió', () => {
    const formas = [];
    const cuerpo = limpiarCuerpo('Necesitas el DNI.\nFíjate el costo.', { alCorregirTuteo: (f) => formas.push(...f) });
    assert.equal(cuerpo, 'Necesitás el DNI.\nFijate el costo.');
    assert.deepEqual(formas, ['Necesitas', 'Fíjate']);
  });
});
