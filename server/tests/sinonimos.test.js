import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandirConSinonimos, GRUPOS_SINONIMOS } from '../src/services/sinonimos.service.js';

describe('mapa de sinónimos curados', () => {
  it('tiene el grupo de partida/acta/certificado de nacimiento, con nacimiento como contexto requerido', () => {
    const grupo = GRUPOS_SINONIMOS.find((g) => g.id === 'partida_acta_certificado_nacimiento');
    assert.ok(grupo);
    assert.deepEqual(grupo.terminos, ['partida', 'acta', 'certificado']);
    assert.deepEqual(grupo.requiere, ['nacimiento']);
  });
});

describe('expandirConSinonimos', () => {
  it('con nacimiento, agrega los demás términos del grupo cuando aparece uno, por palabra completa', () => {
    assert.equal(expandirConSinonimos('acta de nacimiento'), 'acta de nacimiento partida certificado');
    assert.equal(expandirConSinonimos('certificado de nacimiento'), 'certificado de nacimiento partida acta');
    assert.equal(expandirConSinonimos('partida de nacimiento'), 'partida de nacimiento acta certificado');
  });

  it('no repite un término que ya está en la pregunta', () => {
    assert.equal(expandirConSinonimos('partida y certificado de nacimiento'), 'partida y certificado de nacimiento acta');
  });

  it('no distingue mayúsculas ni tildes, en el término ni en el contexto', () => {
    assert.equal(expandirConSinonimos('ACTA de Nacimiento'), 'ACTA de Nacimiento partida certificado');
    assert.equal(expandirConSinonimos('Certificado de NACIMIENTO'), 'Certificado de NACIMIENTO partida acta');
  });

  it('exige la palabra completa: no dispara con un plural u otra palabra que la contiene', () => {
    assert.equal(expandirConSinonimos('necesito las actas de nacimiento'), 'necesito las actas de nacimiento');
    assert.equal(expandirConSinonimos('certificación de nacimiento'), 'certificación de nacimiento');
  });

  it('sin el contexto requerido (nacimiento), no cruza términos de trámites ajenos', () => {
    assert.equal(expandirConSinonimos('certificado de antecedentes'), 'certificado de antecedentes');
    assert.equal(expandirConSinonimos('certificado de libre deuda'), 'certificado de libre deuda');
    assert.equal(expandirConSinonimos('acta de matrimonio'), 'acta de matrimonio');
    assert.equal(expandirConSinonimos('partida de defunción'), 'partida de defunción');
    assert.equal(expandirConSinonimos('certificado'), 'certificado');
  });

  it('sin ningún término del grupo, devuelve la pregunta sin cambios', () => {
    assert.equal(expandirConSinonimos('cómo saco el pasaporte'), 'cómo saco el pasaporte');
    assert.equal(expandirConSinonimos('inscribir un nacimiento'), 'inscribir un nacimiento');
    assert.equal(expandirConSinonimos(''), '');
  });
});
