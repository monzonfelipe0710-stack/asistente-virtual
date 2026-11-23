import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandirConSinonimos, GRUPOS_SINONIMOS } from '../src/services/sinonimos.service.js';

describe('mapa de sinónimos curados', () => {
  it('tiene el grupo de partida/acta/certificado de nacimiento', () => {
    const grupo = GRUPOS_SINONIMOS.find((g) => g.id === 'partida_acta_certificado_nacimiento');
    assert.ok(grupo);
    assert.deepEqual(grupo.terminos, ['partida', 'acta', 'certificado']);
  });
});

describe('expandirConSinonimos', () => {
  it('agrega los demás términos del grupo cuando aparece uno, por palabra completa', () => {
    assert.equal(expandirConSinonimos('acta de nacimiento'), 'acta de nacimiento partida certificado');
    assert.equal(expandirConSinonimos('certificado de nacimiento'), 'certificado de nacimiento partida acta');
    assert.equal(expandirConSinonimos('partida de nacimiento'), 'partida de nacimiento acta certificado');
  });

  it('no repite un término que ya está en la pregunta', () => {
    assert.equal(expandirConSinonimos('partida y certificado de nacimiento'), 'partida y certificado de nacimiento acta');
  });

  it('no distingue mayúsculas ni tildes', () => {
    assert.equal(expandirConSinonimos('ACTA de Nacimiento'), 'ACTA de Nacimiento partida certificado');
    assert.equal(expandirConSinonimos('CERTIFICADO'), 'CERTIFICADO partida acta');
  });

  it('exige la palabra completa: no dispara con un plural u otra palabra que la contiene', () => {
    assert.equal(expandirConSinonimos('necesito las actas'), 'necesito las actas');
    assert.equal(expandirConSinonimos('certificación de estudios'), 'certificación de estudios');
  });

  it('sin ningún término del grupo, devuelve la pregunta sin cambios', () => {
    assert.equal(expandirConSinonimos('cómo saco el pasaporte'), 'cómo saco el pasaporte');
    assert.equal(expandirConSinonimos(''), '');
  });
});
